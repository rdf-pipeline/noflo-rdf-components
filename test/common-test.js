// common-test.js

/**
 * This file contains the common code used for testing components in the noflo 
 * implementation of the RDF Pipeline.
 */

var chai = require('chai');
var expect = chai.expect;

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
    createNetwork: function(nodes) {
        var components = _.pick(nodes, _.isObject);
        return new Promise(function(resolve, reject){
            var graph = new noflo.Graph();
            _.each(_.pick(nodes, _.isString), function(componentName, nodeId) {
                // maps nodeId to componentName
                graph.addNode(nodeId, componentName);
            });
            _.each(components, function(module, name) {
                // use the same name for both nodeId and componentName
                graph.addNode(name, name);
            });
            noflo.createNetwork(graph, function(err, network) {
                if (err instanceof noflo.Network) network = err;
                else if (err) return reject(err);
                _.each(components, function(module, componentName) {
                    // maps componentName to module
                    network.loader.components[componentName] = module;
                });
                network.connect(function(err){
                    if (err) return reject(err);
                    network.start();
                    resolve(network);
                });
            }, true);
        });
    },

    /**
     * Create a component instance from a factory function or module.
     * @this is not used
     * @param factory a function that creates a Component instance or a module with a getComponent function
     * @usage:
     *  var node = test.createComponent(require('noflo/console'))
     *  var node = test.createComponent(componentFactory({}))
     */
    createComponent: function(factory) {

        var node;
        var metadata = {
            facade: function(facade) {
                node = facade;
            }
        };
        var getComponent = _.isFunction(factory) ? factory : factory.getComponent;
        var component = getComponent(metadata);

        if (node) { // using a facade
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

        // return facade if created, otherwise return the noflo.Component instance
        return node ? node : component;
    },

    detachAllInputSockets: function(node) {

        var component = node._component_under_test ? node._component_under_test : node;
        var portNames = Object.keys(node.inPorts);

        if (portNames) {
             portNames.forEach(function(portName) {
                 var port = component.inPorts[portName];
                 var sockets = port.listAttached();
                 if (_.isArray(sockets) && sockets.length > 0) {
                    sockets.forEach(function(socket) {
                        port.detach(socket);
                    });
                 }
             });
        }
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
    },

    /**
     * Verifies that the state has the expected vnid & data and the lm is
     * structured as an lm should be.
     */
    verifyState: function(state, expectedVnid, expectedData, expectedError, expectedStale) { 
        state.should.be.an('object');
        state.should.have.all.keys('vnid', 'lm','data','error','stale');
        state.vnid.should.equal(expectedVnid);
        state.data.should.equal(expectedData);
        state.lm.should.be.a('string');
        state.lm.should.not.be.empty;
        expect(state.error).to.equal(expectedError);
        expect(state.stale).to.equal(expectedStale);
        var lmComponents = state.lm.match(/^LM(\d+)\.(\d+)$/);
        lmComponents.should.have.length(3);
    }

};
