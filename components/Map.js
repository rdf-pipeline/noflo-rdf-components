// FileNode.js

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
            name: {
                description: "Name of this FileNode.  Should be unique within a pipeline.",
                datatype: 'string',
                required: true,
                addressable: false,
                buffered: false,
		multi: true,
                // process: ondata(assign('name'))
		// process: dumpEvent
		process: receiveEvent
            }, 
            state_file: {
                description: "File path to the node state file.",
                datatype: 'string',
                required: true,
                addressable: false,
                buffered: false,
                // process: ondata(assign('state_file'))
		// process: dumpEvent
		process: receiveEvent
            }, 
            updater: {
                description: "File path to the node updater.",
                datatype: 'string',
                required: true,
                addressable: false,
                buffered: false,
                // process: ondata(assign('updater'))
		// process: dumpEvent
		process: receiveEvent
            }, 
            'in': {
                description: "File input - An initial input file",
                datatype: 'string',
                required: true,
                addressable: false,
                buffered: false,
                // process: ondata(execute)
		// process: dumpEvent
		// process: forwardData
		process: receiveEvent
            }
        }
    }), {
        description: "Component for a RDF Pipeline FileNode,\
            using file updater script from the @in port",
        icon: 'external-link'
    });
};

function forwardData(nodeInstance, event, payload) {
  var ps = payload;
  if (typeof payload === 'object') {
    ps = "[payload object]";
  }
  if (event == 'data') {
    console.log("Forwarding "+event+" payload: "+ps);
    console.log("Connect ...");
    nodeInstance.outPorts.out.connect();
    console.log("Send ...");
    nodeInstance.outPorts.out.send("Payload forwarded: "+ps);
    console.log("Disconnect ...");
    nodeInstance.outPorts.out.disconnect();
    console.log("Done");
  }
  if (typeof payload === 'object' && 
    	typeof payload.from === 'object' &&
	typeof payload.from.process === 'object' &&
	typeof payload.from.process.component === 'object') {
    console.log("From component: ", payload.from.process.component);
  }
}

function selfDumpEvent(caller, self, event, payload) {
  console.log("##############################");
  console.log("selfDumpEvent "+caller+" node.port: "+self.node+"."+self.name+" event: "+event+" self: ", self);
  console.log("############");
  console.log("selfDumpEvent "+caller+" node.port: "+self.node+"."+self.name+" event: "+event+" payload: ", payload);
  console.log("############");
  var sockets = self.sockets || [];
  for (var key in sockets) {
    var value = sockets[key];
    console.log("Socket ["+key+"]: ", value);
  }
  console.log("##############################");
  return;
}

function dumpEvent(event, payload) {
  selfDumpEvent("dumpEvent", this, event, payload);
}

// ###################### receiveEvent #########################
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
  var nodeInstance;	// nodeInstance
  var vni;		// VNI for the given vnid
  console.log("############### receiveEvent ###############");
  // console.log("receiveEvent event: "+event+" from node.outport: "+payload.from.process.id+"."+payload.from.port);
  console.log("receiveEvent event: "+event);
  // console.log("receiveEvent event: "+event+" inport: ", inport);
  // console.log("######");
  // console.log("receiveEvent event: "+event+" payload: ", payload);
  // console.log("######");
  if (event != 'data') {
    console.log("receiveEvent ignoring non-data event: "+event);
    console.log("##############################");
    return;
  }
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
    state = newState(payload);
    console.log(" ... IIP event, state saved: ", state);
  }
  nodeInstance = inport.nodeInstance;
  // I (dbooth) have not found a way to initialize nodes in advance,
  // so we do it on the fly when the first event arrives:
  vni = ensureVniExists(nodeInstance, vnid);
  assignInputOrPreviousLm(vni.inputs, inport, state);
  console.log("vni.inputs:", vni.inputs);
  console.log("########");
  maybeFireUpdater(vni, event, payload);
  // TODO: maybeSendEvent(vni, event, payload);
  console.log("receiveEvent done.  Stored state:", state);
  console.log("##############################");
  return;
}


// ###################### assignInputOrPreviousLm #########################
/**
 * previousLms and inputs use the same structure, so this function
 * can be used with either.
 */
function assignInputOrPreviousLm(inputsOrLms, inport, value)
{
  // TODO: Update this for new inputs structure
  if (Array.isArray(inputsOrLms[inport.name])) {
    var nodePort = nodePortString(inport);
    inputsOrLms[inport.name][nodePort] = value;
    console.log("Assigning to array nodePort: ", nodePort);
  } else {
    inputsOrLms[inport.name] = value;
    console.log("Assigning to single value inport: ", inport.name);
  }
}

// ###################### nodePortString #########################
/**
 * For the given port, return "nodeName|portName", caching results.
 */
function nodePortString(port)
{
  return nodePortStringFromStrings(port.nodeInstance.nodeId, port.name);
}

// ###################### nodePortStringFromStrings #########################
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
function maybeFireUpdater(vni, event, payload)
{
  console.log("=============== maybeFireUpdater starting ===============");
  console.log("maybeFireUpdater nodeId: ", vni.selfNode.nodeId);
  console.log("=============== maybeFireUpdater returning ===============");
}

// ###################### maybeSendEvent #########################
function maybeSendEvent(vni, event, payload)
{
  console.log("=============== maybeSendEvent starting ===============");
  console.log("maybeSendEvent nodeId: ", vni.selfNode.nodeId);
  console.log("=====");
  // forwardData is only being used here for testing
  console.log("maybeSendEvent calling forwardData ....");
  forwardData.call(vni, event, payload);
  console.log("=============== maybeSendEvent returning ===============");
}

// ###################### allInputsHaveData #########################
/**
 * Return true iff all required inputs have data.
 */
function allInputsHaveData(vni)
{
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
/**
 * Return true iff the given state is stale wrt the given inputs.
 * This function assumes that all required inputs have data.
 * I.e., allInputsHaveData(vni) must have already been called.
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
/**
 * Return true iff all required inputs have data and any are stale
 * with respect to the node's inputs.
 */
function anyStaleState(vni)
{
/*
  if (typeof vni === 'undefined') { throw new Error("vni undefined"); };
  if (typeof vni.inputs === 'undefined') { throw new Error("vni.inputs undefined"); };
  if (!allInputsHaveData(vni)) { return

  for (var portName in vni.selfNode.inPorts.ports) {
    var input = vni.inputs[portName];
    if (
*/
}

// ###################### newState #########################
/**
 * Create a new node state object, either with or without previousLms,
 * and with or without initial state data and LM.
 * previousLms indicate the LMs of the inports that existed when the state
 * was last updated.  They are remembered in order to detect when
 * the state is stale.  selfPort is the outport to which this state
 * belongs (if any) within a node.  If outport is null then this state is
 * for an IIP rather than being a state for a node's outport, in
 * which case previousLms should also be null.
 */
function newState(data, lm, selfPort, previousLms) {
  // console.log("===============  newState starting ===============");
  // If we're given a data value, then make sure we have an LM:
  if (typeof data !== 'undefined' && !lm) {
    lm = newLm();
  }
  selfPort = (typeof selfPort === 'undefined' ? null : selfPort);
  previousLms = (typeof previousLms === 'undefined' ? null : previousLms);
  var s = {
	data: data,
	lm: lm,
	previousLms: previousLms,
	selfPort: selfPort
  };
  // process.exit(0);
  // console.log("===============  newState returning ===============");
  return(s);
}

// ###################### newVni #########################
/**
 * Create a new VNI (Virtual Node Instance), but do not attach
 * it to the given NoFlo node instance.
 */
function newVni(node, vnid) {
  if (typeof node === 'undefined') {
    throw new Error("newVni called with undefined node");
  }
  if (typeof vnid === 'undefined') {
    throw new Error("newVni called with undefined vnid");
  }
  var vni;
  var inputs = newInputs(node);
  var states = {};
  for (var portName in node.outPorts.ports) {
    var port = node.outPorts.ports[portName];
    var previousLms = newPreviousLms(inputs);
    states[portName] = newState(null, null, port, previousLms);
  }
  vni = {
    inputs: inputs,
    states: states,
    selfNode: node,
    vnid: vnid
  };
  // process.exit(0);
  return(vni);
}

// ###################### newPreviousLms #########################
/**
 * Create a new previousLms hash from an inputs hash of the
 * same node, copying the LMs from the inputs hash to the previousLms hash.
 */
function newPreviousLms(inputs) {
  var previousLms = {};
  for (var portName in inputs) {
    var state = inputs[portName];
    // TODO: Change to new inputs structure
    if (Array.isArray(state)) { 
      var subLms = {};
      for (var nodePort in state) {
	subLms[nodePort] = state[nodePort].lm;
      }
      previousLms[portName] = subLms;
    } else {
      previousLms[portName] = state.lm;
    }
  }
  return previousLms;
}

// ###################### newInputs #########################
/**
 * Create a new inputs hash, initialized to nulls.
 */
function newInputs(node) {
  var inputs = {};
  var i;
  for (var portName in node.inPorts.ports) {
    var port = node.inPorts.ports[portName];
    // Count the IIP vs edge connections for error checking:
    var nIips = 0;	// IIP, i.e., constant input from NoFlo GUI
    var nEdges = 0;	// Edge connection from a node port
    if (!port.sockets) { port.sockets = []; }
    for (i=0; i<port.sockects.length; i++) {
      if (port.sockets[i].from) nEdges++; 
      else nIips++; 
    }
    if (nIips && nEdges) 
      throw new Error("newInputs: Node "+node.id+" port "+portName+" has both "+nEdges+" node connections\n and "+nIips+" constant inputs (IIPs).  You must delete the constant inputs\n if you wish to use node connections.");
    if (nEdges+nIips > 1 && !port.options.multi) 
      throw new Error("newInputs: Node "+node.id+" port "+portName+" has "+n+" connections but was not declared with 'multi: true'");
    var subInputs = inputs[portName] = []; 
    for (i=0; i<port.sockects.length; i++) {
      var sourceNodePort;
      var from = port.sockets[i].from;
      if (from) sourceNodePort = nodePortStringFromStrings(from.process.id, from.port);
      else sourceNodePort = "data"+i;	// IIP has no source node|port
      subInputs[sourceNodePort] = null;
    }
  }
  return inputs;
}

// ###################### ensureVniExists #########################
/**
  * Ensure that the given node's VNI exists
  * for the given vnid (which defaults to ""), and return it.
  * Create it if it doesn't.  
  */
function ensureVniExists(node, vnid) {
  var vni;
  console.log("=========== ensureVniExists starting ===========");
  if (typeof node === 'undefined') {
	throw new Error("ensureVniExists called with undefined node");
  }
  vnid = (typeof vnid === 'undefined' ? "" : vnid);
  if (typeof node.vnis === "undefined") {
    // First VNI for this node
    node.vnis = {};
  }
  vni = node.vnis[vnid];
  if (typeof vni !== 'undefined') {
    // This VNI already exists.  Nothing to do.
    console.log("ensureVniExists: Nothing to do"); 
    console.log("=========== ensureVniExists returning ===========");
    return vni;
  }
  // Create a new VNI and wire it into this node:
  vni = newVni(node, vnid)
  node.vnis[vnid] = vni;
  console.log("ensureVniExists created node.vnis["+vnid+"]: ", vni);
  console.log("=========== ensureVniExists returning ===========");
  // console.log("ensureVniExists node: ", node);
  // process.exit(0);
  return vni;
}

// ###################### newLm #########################
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
      throw new Error("newLm: globalLmCounter exceeded "+COUNTER_LIMIT);
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

