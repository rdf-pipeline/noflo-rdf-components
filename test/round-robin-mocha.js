// round-robin-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var _ = require('underscore');
var path = require('path');
var noflo = require('noflo');
var roundRobin = require('../components/round-robin');

describe('round-robin', function() {
    it("should echo data", function() {
        return createNetwork({
            robin: roundRobin
        }).then(function(network){
            var output = noflo.internalSocket.createSocket();
            network.processes.robin.component.outPorts.output.attach(output);
            return new Promise(function(done) {
                output.on('data', done);
                network.graph.addInitial("Hello World", 'robin', 'input');
            });
        }).should.become("Hello World");
    });
    it("should send second message to second socket", function() {
        return createNetwork({
            robin: roundRobin
        }).then(function(network){
            var pre = noflo.internalSocket.createSocket();
            network.processes.robin.component.outPorts.output.attach(pre);
            var output = noflo.internalSocket.createSocket();
            network.processes.robin.component.outPorts.output.attach(output);
            return new Promise(function(done, fail) {
                output.on('data', done);
                network.graph.addInitial("Hello World", 'robin', 'input');
                network.graph.addInitial("Hello again", 'robin', 'input');
            });
        }).should.become("Hello again");
    });
    it("should skip detached sockets", function() {
        return createNetwork({
            robin: roundRobin
        }).then(function(network){
            var detached = noflo.internalSocket.createSocket();
            network.processes.robin.component.outPorts.output.attach(detached);
            network.processes.robin.component.outPorts.output.detach(detached);
            var output = noflo.internalSocket.createSocket();
            network.processes.robin.component.outPorts.output.attach(output);
            return new Promise(function(done) {
                output.on('data', done);
                network.graph.addInitial("Hello World", 'robin', 'input');
            });
        }).should.become("Hello World");
    });
});

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
function createNetwork(componentModules) {
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
}
