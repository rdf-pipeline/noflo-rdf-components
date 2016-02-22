// request-template-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var http = require('http');
var _ = require('underscore');
var noflo = require('noflo');
var requestTemplate = require('../components/request-template');

describe('request-template', function() {
    var server = http.createServer();
    before(function(){
        server.listen(1337);
    });
    after(function(){
        console.log("after");
        server.close();
    });
    it("should send a request", function() {
        return createNetwork({
            request: requestTemplate
        }).then(function(network){
            server.once('request', function(req, res) {
                res.write("Hello World");
                res.end();
            });
            var output = noflo.internalSocket.createSocket();
            network.processes.request.component.outPorts.output.attach(output);
            return new Promise(function(done) {
                output.on('data', done);
                network.graph.addInitial("http://localhost:1337/", 'request', 'url');
                network.graph.addInitial({}, 'request', 'input');
            });
        }).should.become("Hello World");
    });
    it("should parameterize url", function() {
        return createNetwork({
            request: requestTemplate
        }).then(function(network){
            server.once('request', function(req, res) {
                res.write("Hello World");
                res.end();
            });
            var output = noflo.internalSocket.createSocket();
            network.processes.request.component.outPorts.output.attach(output);
            return new Promise(function(done) {
                output.on('data', done);
                network.graph.addInitial("http://localhost:{port}/", 'request', 'url');
                network.graph.addInitial({port: 1337}, 'request', 'input');
            });
        }).should.become("Hello World");
    });
    it("should support POST", function() {
        return createNetwork({
            request: requestTemplate
        }).then(function(network){
            server.once('request', function(req, res) {
                res.write("Hello " + req.method);
                res.end();
            });
            var output = noflo.internalSocket.createSocket();
            network.processes.request.component.outPorts.output.attach(output);
            return new Promise(function(done) {
                output.on('data', done);
                network.graph.addInitial('POST', 'request', 'method');
                network.graph.addInitial("http://localhost:{port}/", 'request', 'url');
                network.graph.addInitial({port: 1337}, 'request', 'input');
            });
        }).should.become("Hello POST");
    });
    it("should support request headers", function() {
        return createNetwork({
            request: requestTemplate
        }).then(function(network){
            server.once('request', function(req, res) {
                res.write("Hello " + req.headers['content-type']);
                res.end();
            });
            var output = noflo.internalSocket.createSocket();
            network.processes.request.component.outPorts.output.attach(output);
            return new Promise(function(done) {
                output.on('data', done);
                network.graph.addInitial('POST', 'request', 'method');
                network.graph.addInitial("http://localhost:{port}/", 'request', 'url');
                network.graph.addInitial({'Content-Type': '{+type}'}, 'request', 'headers');
                network.graph.addInitial({port: 1337, type: 'text/plain'}, 'request', 'input');
            });
        }).should.become("Hello text/plain");
    });
    it("should support request body", function() {
        return createNetwork({
            request: requestTemplate
        }).then(function(network){
            server.once('request', function(req, res) {
                var body = [];
                req.on('data', function(chunk) {
                    body.push(chunk);
                }).on('end', function() {
                    body = Buffer.concat(body).toString();
                    res.end(body);
                });
            });
            var output = noflo.internalSocket.createSocket();
            network.processes.request.component.outPorts.output.attach(output);
            return new Promise(function(done) {
                output.on('data', done);
                network.graph.addInitial('POST', 'request', 'method');
                network.graph.addInitial("http://localhost:{port}/", 'request', 'url');
                network.graph.addInitial({'Content-Type': '{+type}'}, 'request', 'headers');
                network.graph.addInitial('Hello {{{message}}}', 'request', 'body');
                network.graph.addInitial({port: 1337, type: 'text/plain', message: "World"}, 'request', 'input');
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
