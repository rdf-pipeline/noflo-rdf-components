// http-accept-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var http = require('http');
var _ = require('underscore');
var noflo = require('noflo');
var test = require('./common-test');
var httpAccept = require('../components/http-accept');

describe('http-accept', function() {
    it("should receive a request", function() {
        this.timeout(3000);
        return test.createNetwork({
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
            });
        }).should.eventually.have.property("data", "Hello World");
    });
    it("should receive a request using a sub-graph", function() {
        this.timeout(2750);
        return test.createNetwork({
            accept: "rdf-components/http-accept-server"
        }).then(function(network){
            return new Promise(function(done, fail) {
                var error = noflo.internalSocket.createSocket();
                var output = noflo.internalSocket.createSocket();
                network.processes.accept.component.outPorts.output.attach(output);
                output.on('data', done);
                network.graph.addInitial(1337, 'accept', 'listen');
                var req = http.request({
                    method: 'POST',
                    port: 1337,
                    path: '/'
                });
                req.write("Hello World");
                req.end();
            });
        }).should.eventually.have.property("data", "Hello World");
    });
    it("should respond with 202", function() {
        this.timeout(2750);
        return test.createNetwork({
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
                    done(res.statusCode);
                });
                req.write("Hello World");
                req.end();
            });
        }).should.become(202);
    });
});
