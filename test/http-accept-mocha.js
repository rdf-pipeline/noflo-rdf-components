// http-accept-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var http = require('http');
var _ = require('underscore');
var noflo = require('noflo');
var logger = require('../src/logger');
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
                network.graph.addInitial(1338, 'accept', 'listen');
                var req = http.request({
                    method: 'POST',
                    port: 1338,
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
                network.graph.addInitial(1339, 'webserver', 'listen');
                var req = http.request({
                    method: 'POST',
                    port: 1339,
                    path: '/'
                }, function(res){
                    done(res.statusCode);
                });
                req.write("Hello World");
                req.end();
            });
        }).should.become(202);
    });
    it("should parse JSON object", function() {
        this.timeout(2750);
        return test.createNetwork({
            accept: "rdf-components/http-accept-json"
        }).then(function(network){
            return new Promise(function(done, fail) {
                var error = noflo.internalSocket.createSocket();
                var output = noflo.internalSocket.createSocket();
                network.processes.accept.component.outPorts.output.attach(output);
                output.on('data', done);
                network.graph.addInitial(1340, 'accept', 'listen');
                var req = http.request({
                    method: 'POST',
                    port: 1340,
                    path: '/',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                req.write(JSON.stringify('Hello "World"'));
                req.end();
            });
        }).should.eventually.have.property("data", 'Hello "World"');
    });
    it("should reject plan text", function() {
        this.timeout(2750);
        logger.silence('all');
        return test.createNetwork({
            accept: httpAccept,
            webserver: "webserver/Server",
            response: "webserver/SendResponse"
        }).then(network => new Promise(function(done, fail) {
            network.graph.addEdge('accept', 'accepted', 'response', 'in');
            network.graph.addEdge('accept', 'rejected', 'response', 'in');
            network.graph.addEdge('webserver', 'request', 'accept', 'input');
            var error = noflo.internalSocket.createSocket();
            network.processes.accept.component.outPorts.output.attach(error);
            error.on('data', done);
            network.graph.addInitial('application/json', 'accept', 'type');
            network.graph.addInitial(1341, 'webserver', 'listen');
            var req = http.request({
                method: 'POST',
                port: 1341,
                path: '/',
                headers: {
                    'Content-Type': 'text/plain'
                }
            });
            req.write('Hello "World"');
            req.end();
        })).should.eventually.have.property("error");
    });
});
