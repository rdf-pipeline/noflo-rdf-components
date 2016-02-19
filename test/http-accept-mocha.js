// http-accept-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var http = require('http');
var _ = require('underscore');
var noflo = require('noflo');
var httpAccept = require('../components/http-accept');

describe('http-accept', function() {
    it("should receive a request", function() {
        return createNetwork({
            accept: httpAccept
        }).then(function(network){
            network.graph.addNode('webserver', "webserver/Server");
            network.graph.addNode('response', "webserver/SendResponse");
            network.graph.addEdge('accept', 'accepted', 'response', 'in');
            network.graph.addEdge('accept', 'rejected', 'response', 'in');
            network.graph.addEdge('webserver', 'request', 'accept', 'input');
            return new Promise(function(done, fail) {
                var error = noflo.internalSocket.createSocket();
                network.processes.accept.component.outPorts.error.attach(error);
                error.on('data', fail);
                var output = noflo.internalSocket.createSocket();
                network.processes.accept.component.outPorts.output.attach(output);
                output.on('data', done);
                network.graph.addInitial(1337, 'webserver', 'listen');
                var req = http.request({
                    method: 'POST',
                    port: 1337,
                    path: '/'
                });
                req.write("Hello World");
                req.end();
            }).then(function(resolution){
                network.stop();
                return resolution;
            });
        }).should.become("Hello World");
    });
    it("should respond with 202", function() {
        return createNetwork({
            accept: httpAccept
        }).then(function(network){
            network.graph.addNode('webserver', "webserver/Server");
            network.graph.addNode('response', "webserver/SendResponse");
            network.graph.addEdge('accept', 'accepted', 'response', 'in');
            network.graph.addEdge('accept', 'rejected', 'response', 'in');
            network.graph.addEdge('webserver', 'request', 'accept', 'input');
            return new Promise(function(done, fail) {
                var error = noflo.internalSocket.createSocket();
                network.processes.accept.component.outPorts.error.attach(error);
                error.on('data', fail);
                var output = noflo.internalSocket.createSocket();
                network.processes.accept.component.outPorts.output.attach(output);
                network.graph.addInitial(1337, 'webserver', 'listen');
                var req = http.request({
                    method: 'POST',
                    port: 1337,
                    path: '/'
                }, function(res){
                    network.stop();
                    done(res.statusCode);
                });
                req.write("Hello World");
                req.end();
            });
        }).should.become(202);
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
