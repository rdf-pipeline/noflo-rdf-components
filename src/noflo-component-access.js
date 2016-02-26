// noflo-component-access.js

var _ = require('underscore');
var noflo = require('noflo');

module.exports = facadeComponent;

/**
 * Create a noflo.Component facade from a given component. Access to the component
 * is limited to only select properties and functions.
 * This facade mimic some of the main usage of http://noflojs.org/api/Component.html
 * Usage:
 *  var component = componentAccess(new noflo.Component());
 */
function facadeComponent(component) {
    var facade = {
        get nodeId() {
            return component.nodeId;
        },
        get componentName() {
            return component.componentName;
        }
    };
    return _.extend(facade, {
        inPorts: _.mapObject(_.pick(component.inPorts, isInPort), facadePort.bind(this, facade)),
        outPorts: _.mapObject(_.pick(component.outPorts, isOutPort), facadePort.bind(this, facade))
    });
}

/**
 * Create a noflo Port facade from a given noflo Port that includes only a limited
 * subset of properties and functions.
 * This facade mimic the main usage of http://noflojs.org/api/OutPort.html
 */
function facadePort(nodeInstance, port, name) {
    return _.extend({
        name: name,
        nodeInstance: nodeInstance,
        isMulti: port.isAddressable.bind(port),
        isRequired: port.isRequired.bind(port),
        listAttached: port.listAttached.bind(port),
        getSourceIdOn: function(socketIndex) {
            if (port.sockets[socketIndex] && port.sockets[socketIndex].from)
                return port.sockets[socketIndex].from.process.id;
        },
        getSourcePortNameOn: function(socketIndex) {
            if (port.sockets[socketIndex] && port.sockets[socketIndex].from)
                return port.sockets[socketIndex].from.port;
        }
    }, isOutPort(port) ? {
        connect: port.connect.bind(port),
        send: port.send.bind(port),
        disconnect: port.disconnect.bind(port)
    } : {});
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
