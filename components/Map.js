// Map.js

"use strict";

var util = require('util');
var _ = require('underscore');
var exec = require('child_process').exec;
var fs = require('fs');
var noflo = require('noflo');
var sprintf = require('sprintf-js').sprintf;
var process = require('process');

var globalLmCounter;			// Used by newLm()
var globalNodePortStringCache = {};	// Used by nodePortString

exports.getComponent = function() {
    return _.extend(new noflo.Component({
        outPorts: {
            out: {
                description: "State file for this FileNode",
                datatype: 'string',
                required: false,
                addressable: false,
                buffered: false
            },
            error: {
                description: "Error info or Stderr of the file updater script",
                datatype: 'string',
                required: false,
                addressable: false,
                buffered: false
            }
        },
        inPorts: {
            my_inport: {
                description: "my_inport_description",
                datatype: 'string',
                required: true,
                addressable: false,
                buffered: false,
		multi: true,
		process: receiveEvent
            }, 
            updater: {
                description: "File path to the node updater.",
                datatype: 'string',
                required: true,
                addressable: false,
                buffered: false,
		process: receiveEvent
            }, 
            'in': {
                description: "File input - An initial input file",
                datatype: 'string',
                required: true,
                addressable: false,
                buffered: false,
		process: receiveEvent
            }
        }
    }), {
        description: "Component for a RDF Pipeline FileNode,\
            using file updater script from the @in port",
        icon: 'external-link'
    });
};

// ###################### newPayload #########################
// STATUS: Ready to be merged into base-node
/**
 * Create a new NoFlo event payload.  The properties may depend on 
 * the event type:
 *  data -- Push an event downstream.  Properties:
 *	vnid: sendersVnid
 *	state: refOfSendersOutportState
 */
function newPayload(event, properties) {
  if (event != 'data') return;
  if (!("vnid" in properties)) die("newPayload: data event requires a vnid property");
  if (!("state" in properties)) die("newPayload: data event requires a state property");
  var payload = {
	vnid: properties.vnid,
	state: properties.state };
  return payload;
}

// ###################### forwardData #########################
// STATUS: Ready to be merged into base-node
/**
 * Temporary function to forward data downstream.
 */
function forwardData(vni, toPortName, event, state) {
  var nodeInstance = vni.selfNode;
  if (event != 'data') return;
  console.log("forwardData Forwarding "+event+" to port: "+toPortName);
  console.log("forwardData Connect ...");
  if (!nodeInstance) die("forwardData: Bad nodeInstance");
  if (!nodeInstance.outPorts) die("forwardData: Bad nodeInstance.outPorts");
  if (!nodeInstance.outPorts.ports) die("forwardData: Bad nodeInstance.outPorts.ports");
  if (!nodeInstance.outPorts.ports[toPortName]) die("forwardData: Bad nodeInstance.outPorts.ports["+toPortName+"]");
  // console.log("forwarData port: ", util.inspect(nodeInstance.outPorts.ports[toPortName]));
  // process.exit(1);
  var toPort = nodeInstance.outPorts.ports[toPortName];
  var payload = newPayload(event, {vnid: vni.vnid, state: state});
  toPort.connect();
  console.log("forwardData Send ...");
  toPort.send(payload);
  console.log("forwardData Disconnect ...");
  toPort.disconnect();
  console.log("forwardData Done");
}

// ###################### receiveEvent #########################
// STATUS: Ready to be merged into base-node
/**
 * receiveEvent is for handling all NoFlo events on all inports.
 * At some point we might extend it to handle other RDF Pipeline
 * events.
 */
function receiveEvent(event, payload) {
  selfReceiveEvent(this, event, payload);
}

function selfReceiveEvent(inport, event, payload) {
  var vnid;
  var state;		// Used for IIP events
  var inportName = inport.name;
  var nodeInstance = inport.nodeInstance;
  var vni;		// VNI for the given vnid
  if (event != 'data') {
    console.log("receiveEvent "+nodeInstance.nodeId+"|"+inportName+" ignoring non-data event: "+event);
    return;
  }
  console.log("############### receiveEvent BEGIN ###############");
  console.log("receiveEvent "+nodeInstance.nodeId+"|"+inportName+" event: "+event);
  console.log("receiveEvent processing data event.  Payload: ", payload);
  console.log("######");
  // Node-sent event or IIP event?
  if (typeof payload == 'object' && ('vnid' in payload)) {
    console.log(" ... event from a node");
    // A node sent it.
    vnid = payload.vnid;
    state = payload.state;
    console.log(" ... event from node.outport: "+payload.from.process.id+"."+payload.from.port+" state saved: ", state);
  } else {
    console.log(" ... IIP event ");
    // IIP event
    vnid = "";
    state = newConstantState(payload);
    // console.log(" ... IIP event, state saved: ", state);
  }
  // I (dbooth) have not found a way to initialize nodes in advance,
  // so we do it on the fly when the first event arrives:
  vni = ensureVniExists(nodeInstance, vnid);
  var senderNodePortString = nodePortString(state.selfPort);
  vni.inputs[inportName][senderNodePortString] = state;
  console.log("receiveEvent stored state:", state);
  console.log("receiveEvent "+nodeInstance.nodeId+" vnis["+util.inspect(vnid)+"] is now:");
  dumpVni(vni);
  // console.log("vni.inputs:", vni.inputs);
  // console.log("########");
  maybeFireUpdater(vni, event, payload);
  maybeSendEvent(vni, event, payload);
  console.log("############### receiveEvent END ###############");
  // console.log("EXITING"); process.exit(0);
  return;
}


// ###################### nodePortString #########################
// STATUS: Ready to be merged into base-node
/**
 * For the given port, return "nodeName|portName", caching results.
 * If port is null, then return "data0", indicating constant input (NoFlo IIP).
 * We have no way to distinguish different IIPs that are on the
 * same inport.  Therefore, we do not allow multiple IIPs on
 * the same inport.  This is enforced in the newInputs() function.
 */
function nodePortString(port)
{
  if (port) return nodePortStringFromStrings(port.nodeInstance.nodeId, port.name);
  else return "data0";
}

// ###################### nodePortStringFromStrings #########################
// STATUS: Ready to be merged into base-node
/**
 * Given nodeName and portName return "nodeName|portName", caching results.
 */
function nodePortStringFromStrings(nodeName, portName)
{
  var nodePortHash = globalNodePortStringCache[nodeName];
  if (!nodePortHash) {
    nodePortHash = globalNodePortStringCache[nodeName] = {};
  }
  var s = nodePortHash[portName];
  if (!s) {
    s = nodePortHash[portName] = (nodeName + "|" + portName);
  }
  return s;
}

// ###################### maybeFireUpdater #########################
// STATUS: Ready to be merged into base-node
function maybeFireUpdater(vni, event, payload)
{
  console.log("=============== maybeFireUpdater starting ===============");
  console.log("maybeFireUpdater nodeId: ", vni.selfNode.nodeId);
  console.log("maybeFireUpdater UNFINISHED");
  console.log("=============== maybeFireUpdater returning ===============");
}

// ###################### maybeSendEvent #########################
// STATUS: Ready to be merged into base-node
function maybeSendEvent(vni, event, payload)
{
  console.log("=============== maybeSendEvent starting ===============");
  console.log("maybeSendEvent nodeId: ", vni.selfNode.nodeId);
  console.log("=====");
  // forwardData is only being used here for testing
  console.log("maybeSendEvent calling forwardData ....");
  var state = vni.states["out"];
  state.data = "Forwarded data: "+payload;
  state.lm = newLm();
  forwardData(vni, "out", event, state);
  console.log("maybeSendEvent UNFINISHED");
  console.log("=============== maybeSendEvent returning ===============");
}

// ###################### allInputsHaveData #########################
// STATUS: Not yet used or tested
/**
 * Return true iff all required inputs have data.
 */
function allInputsHaveData(vni)
{
  console.log("allInputsHaveData UNTESTED");
  for (var portName in vni.selfNode.inPorts.ports) {
    var port = vni.selfNode.inPorts[portName];
    if (port.required) {
      var state = vni.inputs[portName];
      if (!state || !state.lm) { return false; }
    }
  }
  return true;
}

// ###################### isStale #########################
// STATUS: Not yet used or tested
/**
 * Return true iff the given state is stale wrt the given inputs.
 * This function assumes that all required inputs have data.
 * I.e., allInputsHaveData(vni) must have already returned true.
 */
function isStale(inputs, state)
{
  if (!state.lm) { return true; }
  for (var portName in inputs) {
    var outerInputLm = inputs[portName];
    var outerStateInLm = state.previousLms[portName];
    if (typeof outerInputLm === 'string') {
      // Single connection
      // Optional port is allowed to have no data.
    console.log("isStale UNFINISHED");
// *** STOPPED HERE***
    inputs.in1.data  
    inputs.in2[i].state.data
    inputs.in2[i].sender
    var state = vni.inputs[portName];
    if (!state || !state.lm) { return false; }
    }
  }
  return true;
}

// ###################### anyStaleState #########################
// STATUS: Not yet used or tested
/**
 * Return true iff all required inputs have data and any are stale
 * with respect to the node's inputs.
 */
function anyStaleState(vni)
{
console.log("anyStaleState UNFINISHED");
/*
  if (typeof vni === 'undefined') { die("vni undefined"); };
  if (typeof vni.inputs === 'undefined') { die("vni.inputs undefined"); };
  if (!allInputsHaveData(vni)) { return

  for (var portName in vni.selfNode.inPorts.ports) {
    var input = vni.inputs[portName];
    if (
*/
}

// ###################### ensureVniExists #########################
// STATUS: Ready to be merged into base-node
/**
  * Ensure that the given node's VNI exists
  * for the given vnid (which defaults to ""), and return it.
  * Create it if it doesn't.   This is needed because we do not
  * have a way to initialize VNIs when NoFlo starts running the
  * network.  Instead, we initialize each node on the fly when
  * an event is first sent to it.
  */
function ensureVniExists(node, vnid) {
  var vni;
  // console.log("=========== ensureVniExists starting ===========");
  if (typeof node === 'undefined') {
	die("ensureVniExists called with undefined node");
  }
  vnid = (typeof vnid === 'undefined' ? "" : vnid);
  if (typeof node.vnis === "undefined") {
    // First VNI for this node
    node.vnis = {};
  }
  vni = node.vnis[vnid];
  if (typeof vni !== 'undefined') {
    // This VNI already exists.  Nothing to do.
    // console.log("ensureVniExists: Nothing to do"); 
    // console.log("=========== ensureVniExists returning ===========");
    return vni;
  }
  // Create a new VNI and wire it into this node:
  // console.log("ensureVniExists: Creating a new VNI for vnid: "+util.inspect(vnid)); 
  vni = newVni(node, vnid)
  // console.log("=========== ensureVniExists dumped vni ===========");
  node.vnis[vnid] = vni;
  console.log("ensureVniExists created "+node.nodeId+" node.vnis["+util.inspect(vnid)+"]:");
  // console.log("=========== ensureVniExists returning ===========");
  // console.log("ensureVniExists node: ", node);
  // process.exit(0);
  return vni;
}

// ###################### newVni #########################
// STATUS: Ready to be merged into base-node
/**
 * Create a new VNI (Virtual Node Instance), but do not attach
 * it to the given NoFlo node instance.
 */
function newVni(node, vnid) {
  // console.log("----- newVni starting");
  if (typeof node === 'undefined') {
    die("newVni called with undefined node");
  }
  if (typeof vnid === 'undefined') {
    die("newVni called with undefined vnid");
  }
  var vni;
  var inputs = newInputs(node);
  var states = newStatesFromInputs(node, inputs);
  vni = {
    inputs: inputs,
    states: states,
    selfNode: node,
    vnid: vnid
  };
  // console.log("----- newVni returning");
  // process.exit(0);
  return(vni);
}

// ###################### dumpVni #########################
// STATUS: Ready to be merged into base-node
/**
 * Print the given VNI to the console.
 */
function dumpVni(vni) {
  var nodeName;
  if (typeof vni === 'undefined') nodeName = "undefined vni";
  else if (vni === null) nodeName = "null vni";
  else if (!vni.selfNode) nodeName = "undefined vni.selfNode";
  else nodeName = vni.selfNode.nodeId;
  console.log("---------------- BEGIN dumpVni: "+nodeName+" ----------------");
  if (typeof vni === 'object') {
    console.log("vnid: "+util.inspect(vni.vnid));
    console.log("inputs: ", vni.inputs);
    console.log("states: ");
    for (var portName in vni.states) {
      var state = vni.states[portName];
      console.log("  "+portName+": ");
      console.log("    data: "+util.inspect(state.data));
      console.log("    lm: "+util.inspect(state.lm));
      var prev = util.inspect(state.previousLms);
      prev = prev.replace(/\r?\n/g, "\n    ");
      console.log("    previousLms: "+prev);
      var selfPort = state.selfPort
      console.log("    selfPort: "+nodePortString(state.selfPort));
    }
    console.log("selfNode: "+nodeName);
  }
  console.log("---------------- END dumpVni: "+nodeName+" ----------------");
}

// ###################### newStatesFromInputs #########################
// STATUS: Ready to be merged into base-node
/**
 * Create a new states hash from a NoFlo node instance and an inputs hash,
 * initializing state data and previousLms to undefined.
 */
function newStatesFromInputs(node, inputs) {
  // console.log("--- newStatesFromInputs starting");
  var states = {};
  for (var outportName in node.outPorts.ports) {
    var outport = node.outPorts.ports[outportName];
    // console.log("newStatesFromInputs outportName: ", outportName);
    var s = setStateLmsFromInputs(undefined, outport, inputs, false);
    states[outportName] = s;
  }
  // console.log("--- newStatesFromInputs returning");
  return states;
}

// ###################### setStateLmsFromInputs #########################
// STATUS: Ready to be merged into base-node
/**
 * Set a state's previous LMs based on an inputs object.  The state's
 * previousLms are either set from the LMs in the inputs object (if
 * setLmsFromInputs is true) or set to null (otherwise).
 * If a state object is provided it will be used.  If a null state
 * argument is given then a new state object will be created.  In either
 * case the new state is returned.  Note that the data and lm 
 * fields are *not* set by this function.  They must be set
 * separately if necessary.
 */
function setStateLmsFromInputs(state, outport, inputs, setLmsFromInputs) {
  // console.log("----- setStatesFromInputs starting");
  if (!state) state = newState(undefined, undefined, outport, 
    		setPreviousLms(null, inputs, setLmsFromInputs));
  else setPreviousLms(state.previousLms, inputs, setLmsFromInputs);
  // console.log("----- setStatesFromInputs returning");
  return state;
}

// ###################### newConstantState #########################
// STATUS: Ready to be merged into base-node
/**
 * Create a new state object for a constant input (NoFlo IIP).
 */
function newConstantState(data) {
  var s = newState(data, newLm(), null, null);
  return(s);
}

// ###################### newState #########################
// STATUS: Ready to be merged into base-node
/**
 * Create a new node state object.  previousLms must
 * have already been created if the state is for an output port
 * (i.e., if outport is set).  If outport is not set then
 * a state is being created for an IIP, in which case previousLms
 * must *not* be set.   If defined data is passed but lm is falsey,
 * then a newLm() will be generated for the lm.
 */
function newState(data, lm, outport, previousLms) {
  // console.log("===============  newState starting ===============");
  // If we're given a data value, we should have an LM:
  if (typeof data !== 'undefined' && !lm) {
    lm = newLm();
  }
  if (outport && !previousLms)
    die("newState: outport provided with no previousLms");
  if (previousLms && !outport)
    die("newState: previousLms provided with no outport");
  var s = {
	data: data,
	lm: lm,
	previousLms: previousLms,
	selfPort: outport
  };
  // process.exit(0);
  // console.log("===============  newState returning ===============");
  return(s);
}

// ###################### die #########################
// STATUS: Ready to be merged into base-node
/**
 * Crash and burn with useful info.
 */
function die() {
  // Make real array from arguments first:
  var args = Array.prototype.slice.call(arguments); 
  args.unshift("[ERROR] ");
  console.log.apply(null, args);
  console.trace();
  process.exit(1);
}

// ###################### setPreviousLms #########################
// STATUS: Ready to be merged into base-node
/**
 * Set LMs in a previousLms hash from an inputs hash (of the
 * same node), copying the LMs from the inputs hash to the previousLms hash
 * if setLmsFromInputs is true; otherwise set LMs to undefined.
 * If previousLms is undefined or null, a new object will be created.
 */
function setPreviousLms(previousLms, inputs, setLmsFromInputs) {
  // console.log("----- setPreviousLms starting");
  var useOld = previousLms;
  if (!useOld) previousLms = {};
  for (var portName in inputs) {
    var subPreviousLms = previousLms[portName] = (useOld ? previousLms[portName] : {});
    var subInputs = inputs[portName];
    for (var senderNodePort in subInputs) {
      if (setLmsFromInputs) {
        var state = subInputs[senderNodePort];
        if (!state) die("setPreviousLms: Bad state object in inputs["+portName+"]["+senderNodePort+"]");
        subPreviousLms[senderNodePort] = state.lm;
      } else {
        subPreviousLms[senderNodePort] = undefined;
      }
    }
  }
  // console.log("----- setPreviousLms returning");
  return previousLms;
}

// ###################### newInputs #########################
// STATUS: Ready to be merged into base-node
/**
 * Create a new inputs hash, initialized to nulls.
 */
function newInputs(node) {
  // console.log("----- newInputs starting");
  var inputs = {};
  var i;
  if (!node) die("newInputs: Called with bad node");
  if (!node.inPorts) die("newInputs: Called with bad node.inPorts");
  if (!node.inPorts.ports) die("newInputs: Called with bad node.inPorts.ports");
  for (var portName in node.inPorts.ports) {
    // console.log("newInputs portName: ", portName);
    var port = node.inPorts.ports[portName];
    if (!port) die("newInputs: INTERNAL ERROR: Bad port");
    // Count the IIP vs edge connections for error checking:
    var nIips = 0;	// IIP, i.e., constant input from NoFlo GUI
    var nEdges = 0;	// Edge connection from a node port
    if (!port.sockets) { port.sockets = []; }
    // console.log("newInputs port.sockets.length: ", port.sockets.length);
    for (i=0; i<port.sockets.length; i++) {
      if (port.sockets[i].from) nEdges++; 
      else nIips++; 
    }
    if (nIips && nEdges) 
      die("newInputs: Node "+node.id+" port "+portName+" has both "+nEdges+" node connections\n and "+nIips+" constant inputs (IIPs).  You must delete the constant inputs\n if you wish to use node connections.");
    if (nEdges+nIips > 1 && !port.options.multi) 
      die("newInputs: Node "+node.id+" port "+portName+" has "+n+" connections but was not declared with 'multi: true'");
    // We have no way to distinguish different IIPs that are on the
    // same inport.  Therefore, we do not allow multiple IIPs on
    // the same inport.  
    if (nIips > 1) 
      die("newInputs: Node "+node.id+" port "+portName+" has "+nIips+" constant input (IIP) connections \n but only one is permitted per inport.");
    var subInputs = inputs[portName] = []; 
    for (i=0; i<port.sockets.length; i++) {
      var senderNodePort;
      var from = port.sockets[i].from;
      if (from) senderNodePort = nodePortStringFromStrings(from.process.id, from.port);
      else senderNodePort = "data"+i;	// IIP has no sender node|port
      subInputs[senderNodePort] = null;
    }
  }
  // console.log("----- newInputs returning");
  return inputs;
}

// ###################### newLm #########################
// STATUS: Ready to be merged into base-node
/**
 * Return a new LM each time this is called, based on the currently
 * reported seconds since the epoch on this server, plus a 
 * counter.  The counter ensures that the returned LM is
 * guaranteed to be unique within this process, no matter how fast
 * or frequently newLm() is called, assuming that
 * this code is single-threaded (as in node.js).
 */
function newLm() {
  //                  123456789
  var COUNTER_LIMIT = 999999999;
  var newMs = Date.now();
  var lmc;
  var result;
  if (typeof globalLmCounter === 'undefined') {
    globalLmCounter = {
      ms: newMs,
      counter: 0
    };
  }
  lmc = globalLmCounter;
  if (lmc.ms === newMs) {
    lmc.counter++;
    // Perl implementation uses seconds.subseconds:
    //   LM1387256252.000000000000 
    // JavaScript implementation uses milliseconds.submilliseconds:
    //   LM1387256252000.000000000 
    if (lmc.counter > COUNTER_LIMIT) {
      die("newLm: globalLmCounter exceeded "+COUNTER_LIMIT);
    }
  } else {
    lmc.ms = newMs;
    lmc.counter = 0;
  }
  result = sprintf("LM%013d.%09d", 
                          lmc.ms,
                          lmc.counter);
  // console.log("newLm returning: ", result);
  return result;
}

// ###################### formalParameters #########################
// STATUS: Ready to be merged into base-node
// http://stackoverflow.com/questions/6921588/is-it-possible-to-reflect-the-arguments-of-a-javascript-function#answer-13660631
// https://github.com/angular/angular.js/blob/master/src/auto/injector.js

var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
var FN_ARG_SPLIT = /,/;
var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

function formalParameters(fn) {
   var fnText,argDecl;
   var args=[];
   fnText = fn.toString().replace(STRIP_COMMENTS, '');
   argDecl = fnText.match(FN_ARGS);
   var r = argDecl[1].split(FN_ARG_SPLIT);
   for(var a in r){
      var arg = r[a];
      arg.replace(FN_ARG, function(all, underscore, name){
         args.push(name);
      });
   }
   return args;
 }

