// common-test.js

/**
 * This file contains the common code used for testing components in the noflo 
 * implementation of the RDF Pipeline.
 */

var noflo = require('noflo');
var _ = require('underscore');

module.exports = {

    createComponent: function(getComponent) {

        var component = getComponent();

        _.forEach(component.inPorts, function(port, name) {
            port.nodeInstance = component;
            port.name = name;
        });

        _.forEach(component.outPorts, function(port, name) {
            port.nodeInstance = component;
            port.name = name;
        });

        return component;
    },

    sendData: function(component, port, payload) {

        var socket = noflo.internalSocket.createSocket();
        component.inPorts[port].attach(socket);

        socket.send(payload);
        socket.disconnect();

        component.inPorts[port].detach(socket);
   }
};
