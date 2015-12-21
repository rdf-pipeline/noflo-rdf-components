// FileNode.js

var _ = require('underscore');
var exec = require('child_process').exec;
var fs = require('fs');
var noflo = require('noflo');
var sprintf = require('sprintf-js').sprintf;
var process = require('process');

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
                // process: ondata(assign('name'))
		process: dumpEvent
            }, 
            state_file: {
                description: "File path to the node state file.",
                datatype: 'string',
                required: true,
                addressable: false,
                buffered: false,
                // process: ondata(assign('state_file'))
		process: dumpEvent
            }, 
            updater: {
                description: "File path to the node updater.",
                datatype: 'string',
                required: true,
                addressable: false,
                buffered: false,
                // process: ondata(assign('updater'))
		process: dumpEvent
            }, 
            'in': {
                description: "File input - An initial input file",
                datatype: 'string',
                required: true,
                addressable: false,
                buffered: false,
                // process: ondata(execute)
		// process: dumpEvent
		process: forwardData
            }
        }
    }), {
        description: "Component for a RDF Pipeline FileNode,\
            using file updater script from the @in port",
        icon: 'external-link'
    });
};

function forwardData(event, payload) {
  var ps = payload;
  if (typeof payload === 'object') {
    ps = "[payload object]";
  }
  selfDumpEvent("forwardData", this, event, payload);
  if (event == 'data') {
    console.log("Forwarding "+event+" payload: "+payload);
    console.log("Connect ...");
    this.nodeInstance.outPorts.out.connect();
    console.log("Send ...");
    this.nodeInstance.outPorts.out.send(payload);
    console.log("Disconnect ...");
    this.nodeInstance.outPorts.out.disconnect();
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
  console.log(caller+" node.port: "+self.node+"."+self.name+" event: "+event+" self: ", self);
  console.log("############");
  console.log(caller+" node.port: "+self.node+"."+self.name+" event: "+event+" payload: ", payload);
  console.log("##############################");
  return;
}

function dumpEvent(event, payload) {
  selfDumpEvent("dumpEvent", this, event, payload);
}

function assign(name){
    return function(data){
        this[name] = data;
	console.log("this in assign anon fn: ", this);
    };
}

function ondata(callback) {
    return function(event, payload) {
	console.log("ondata this.nodeInstance: ", this.nodeInstance);
	initNode(this.nodeInstance);
	console.log("After initNode");
	process.exit(0);
	bufferInport(this, event, payload);
	console.log("ondata this: ", this);
	// process.exit(0);
	// console.log("ondata event: ", event);
	// console.log("ondata payload: ", payload);
        switch(event) {
            case 'data': return callback.call(this.nodeInstance, payload);
        };
    };
}

function execute(data) {

        if (!this.name || !this.state_file || !this.updater || !data) 
            throw new Error("Execute called with missing data.");
	var self = this;
       
        // var updaterCmd = this.updater + " " + data;

	console.log("David logged a message");
	if (0) {
	console.log("noflo properties:");
	for (var name in noflo) {
	  console.log("  " + name);
	  }
	console.log("noflo.Network properties:");
	for (var name in noflo.Network) {
	  console.log("  " + name);
	  }
	console.log("noflo.graph properties:");
	for (var name in noflo.graph) {
	  console.log("  " + name);
	  }
	console.log("noflo.Graph properties:");
	for (var name in noflo.Graph) {
	  console.log("  " + name);
	  }
	console.log("this properties:");
	for (var name in this) {
	  console.log("  " + name);
	  }
	console.log("this.inPorts properties:");
	for (var name in this.inPorts) {
	  console.log("  " + name);
	  }
	console.log("this.inPorts.ports properties:");
	for (var name in this.inPorts.ports) {
	  console.log("  " + name);
	  }
	console.log("this.inPorts.ports.name properties:");
	for (var name in this.inPorts.ports.name) {
	  console.log("  " + name);
	  }
	};
	console.log("this: %o", this);
	// var n = addNode("NewNode");
        // if (!n) 
            // throw new Error("Failed to addNode");

}

function bufferInport(port, event, payload) {
	console.log("port.vni: ", port.vni);
	console.log("ondata port: ", port);
	console.log("ondata event: ", event);
	console.log("ondata payload: ", payload);
}

/**
 * Create a new node state object, either with or without inLms.
 * inLms indicate the LMs of the inports that existed when the state
 * was last updated.  They are remembered in order to detect when
 * the state is stale.  State objects that are only referenced 
 * by inports -- i.e., that are not associated with outports --
 * do not need inLms.  
 */
function newState(ports) {
  var s = {
	data: null,
	lm: nextLm()	
  };
  if (typeof ports !== 'undefined' && ports !== null) {
    s.inLm = {};
    for (var port in ports) {
      // console.log("newState initializing s.inLm port: ", port);
      s.inLm[port] = null;
    }
    // process.exit(0);
  }
  return(s);
}

/**
 * Create a new VNI (Virtual Node Instance) and attach
 * it to the given NoFlo node instance.
 */
function newVni(node, vnid) {
  var vni;
  if (typeof node === 'undefined') {
    throw new Error("newVni called with undefined node");
  }
  if (typeof vnid === 'undefined') {
    throw new Error("newVni called with undefined vnid");
  }
  if (typeof node.vni === "undefined") {
    // First VNI for this node
    node.vni = {};
  }
  if (vnid in node.vni) {
    throw new Error("newVni called with duplicate vnid: "+vnid);
  }
  vni = {
    inportBuffer: {},
    outportState: {},
    node: node,
    vnid: vnid
  };
  node.vni[vnid] = vni;
  for (var port in node.inPorts.ports) {
    // console.log("Initializing inportBuffer for node.inPorts port: ", port);
// *** STOPPED HERE ***
    vni.inportBuffer[port] = null;
  }
  // process.exit(0);
  return(vni);
}

function initVirtualNode(node, vnid) {
  if (typeof node.vni === "undefined") {
    node.vni = [];
    // Default vni will be "" (empty string).  Used only if
    // the node is not virtual.
    // Initialized default vni (empty string):
    node.vni[""] = newVni(node, "");
  }
  // console.log("initNode node: ", node);
  if (typeof server === 'undefined') {
    console.log("initNode server is undefined ");
    process.exit(0);
  }
  console.log("initNode server: ", server);
  process.exit(0);
}

function initNode(node) {
  if (typeof node.vni === "undefined") {
    node.vni = [];
    // Default vni will be "" (empty string).  Used only if
    // the node is not virtual.
    // Initialized default vni (empty string):
    node.vni[""] = newVni(node, "");
  }
  // console.log("initNode node: ", node);
  if (typeof server === 'undefined') {
    console.log("initNode server is undefined ");
    process.exit(0);
  }
  console.log("initNode server: ", server);
  process.exit(0);
}

/**
 * Return a new LM each time this is called, based on the currently
 * reported seconds since the epoch on this server, plus a 
 * counter.  The counter ensures that the returned LM is
 * guaranteed to be unique within this process, no matter how fast
 * or frequently nextLm() is called, assuming that
 * this code is single-threaded (as in node.js).
 */
function nextLm() {
  //                  123456789
  var COUNTER_LIMIT = 999999999;
  var ms = Date.now();
  var lmc;
  var result;
  if (rdfp.server.lmCounter === null) {
    rdfp.server.lmCounter = {
      ms: ms,
      counter: 0
    };
  }
  lmc = rdfp.server.lmCounter;
  if (lmc.ms == ms) {
    lmc.counter++;
    // Perl implementation use seconds.subseconds:
    //   LM1387256252.000000000000 
    // JavaScript implementation uses milliseconds.submilliseconds:
    //   LM1387256252000.000000000 
    if (lmc.counter > COUNTER_LIMIT) {
      throw new Error("nextLm: counter exceeded "+counterLimit);
    }
  } else {
    lmc.ms = ms;
    lmc.counter = 0;
  }
  result = sprintf("LM%013d.%09d", 
                          lmc.ms,
                          lmc.counter);
  // console.log("nextLm returning: ", result);
  return result;
}

