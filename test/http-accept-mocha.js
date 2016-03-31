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
            }).then(function(resolution){
                network.stop();
                return resolution;
            });
        }).should.eventually.have.property("data", "Hello World");
    });
    it("should respond with 202", function() {
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
                    network.stop();
                    done(res.statusCode);
                });
                req.write("Hello World");
                req.end();
            });
        }).should.become(202);
    });
});
