// noflo-component-access.js

var _ = require('underscore');
var noflo = require('noflo');

module.exports = facadeComponent;

/**
 * Create a noflo.Component facade from a given node. Access to the node
 * is limited to only select properties and functions.
 * This facade mimics some of the main usage of http://noflojs.org/api/Component.html
 * @this is not used
 * @param node a Component instance
 * Usage:
 *  var node = componentAccess(new noflo.Component());
 */
function facadeComponent(node) {
    var facade = {
        get nodeName() {
            return node.nodeId;
        },
        get componentName() {
            return node.componentName;
        }
    };
    return _.extend(facade, {
        inPorts: _.mapObject(_.pick(node.inPorts, isInPort), facadePort.bind(this, facade)),
        outPorts: _.mapObject(_.pick(node.outPorts, isOutPort), facadePort.bind(this, facade))
    });
}

/**
 * Create a noflo Port facade from a given noflo Port that includes only a limited
 * subset of properties and functions.
 * This facade mimics some of the main usage of http://noflojs.org/api/OutPort.html
 */
function facadePort(nodeInstance, port, portName) {
    return _.extend({
        name: portName,
        nodeInstance: nodeInstance,
        isMulti: port.isAddressable.bind(port),
        isRequired: port.isRequired.bind(port),
        listAttached: port.listAttached.bind(port)
    }, isOutPort(port) ? {
        connect: port.connect.bind(port),
        send: port.send.bind(port),
        sendIt: sendIt.bind(port),
        disconnect: port.disconnect.bind(port)
    } : {
        isSingleIIP: isSingleIIP.bind(port)
    });
}

/**
 * Tests if the given object is a noflo.InPort
 * @param port a noflo.InPort if the result is true
 */
function isInPort(port) {
    return port instanceof noflo.InPort;
}

/**
 * Tests if the given object is a noflo.OutPort
 * @param port a noflo.OutPort if the result is true
 */
function isOutPort(port) {
    return port instanceof noflo.OutPort;
}

function sendIt(data) { 
    this.send(data);
    this.disconnect();
}

/**
 * returns true if the port has a single IIP input, false if not.
 */
function isSingleIIP() { 

    // If no sockets, we are likely in the process of initialization.  
    if (_.isUndefined(this.sockets)) return false;

    // If one socket, there is only one input.  Is it an IIP?
    if (this.sockets.length === 1) {
        // If no from, then this is an IIP. 
        return _.isUndefined(this.sockets[0].from);
    }

    return false;
}
