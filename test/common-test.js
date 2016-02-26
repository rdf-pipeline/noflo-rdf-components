// common-test.js

/**
 * This file contains the common code used for testing components in the noflo 
 * implementation of the RDF Pipeline.
 */

var noflo = require('noflo');
var _ = require('underscore');

module.exports = {

    /**
     * Creates and starts a noflo.Network with a component for every component module
     * given, however, no edges are present.
     * Usage:
     *  createNetwork({name:require('../components/rdf')}).then(function(network){
     *      network.processes.name.component is the component instance
     *      network.graph.addEdge('name', 'output', 'name', 'input') to add edge
     *      network.graph.addInitial(data, 'name', 'input') to send data
     *  });
     */
    createNetwork: function(componentModules) {
        var graph = new noflo.Graph();
        _.each(componentModules, function(module, name) {
            // maps node to factory
            graph.addNode(name, name);
        });
        return new Promise(function(resolve, reject){
            noflo.createNetwork(graph, function(err, network) {
                if (err instanceof noflo.Network) network = err;
                else if (err) return reject(err);
                _.each(componentModules, function(module, name) {
                    // maps factory to module
                    network.loader.components[name] = module;
                });
                network.connect(function(err){
                    if (err) return reject(err);
                    network.start();
                    resolve(network);
                });
            }, true);
        });
    },

    createComponent: function(factory) {

        var node;
        var metadata = {
            facade: function(facade) {
                node = facade;
            }
        };
        var getComponent = _.isFunction(factory) ? factory : factory.getComponent;
        var component = getComponent(metadata);

        if (node) {
            node._component_under_test = component;
        }

        _.forEach(component.inPorts, function(port, name) {
            port.nodeInstance = component;
            port.name = name;
        });

        _.forEach(component.outPorts, function(port, name) {
            port.nodeInstance = component;
            port.name = name;
        });

        return node ? node : component;
    },

    sendData: function(node, port, payload) {
        var component = node._component_under_test ? node._component_under_test : node;

        var socket = noflo.internalSocket.createSocket();
        component.inPorts[port].attach(socket);

        socket.send(payload);
        socket.disconnect();

        component.inPorts[port].detach(socket);
   },

    onOutPortData: function(node, portName, handler) {
        var component = node._component_under_test ? node._component_under_test : node;
        var socket = noflo.internalSocket.createSocket();
        component.outPorts[portName].attach(socket);
        socket.on('data', handler.bind(node.outPorts[portName]));
    }
};
