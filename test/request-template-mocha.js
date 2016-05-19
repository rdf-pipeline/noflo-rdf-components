// request-template-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var http = require('http');
var _ = require('underscore');
var noflo = require('noflo');
var test = require('./common-test');
var requestTemplate = require('../components/request-template');

describe('request-template', function() {
    this.timeout(3500);
    var server = http.createServer();
    before(function(){
        server.listen(1337);
    });
    after(function(){
        server.close();
    });
    it("should send a request", function() {
        return test.createNetwork({
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
        }).should.eventually.have.property('data', "Hello World");
    });
    it("should parameterize url", function() {
        return test.createNetwork({
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
        }).should.eventually.have.property('data', "Hello World");
    });
    it("should support POST", function() {
        return test.createNetwork({
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
        }).should.eventually.have.property('data', "Hello POST");
    });
    it("should support request headers", function() {
        return test.createNetwork({
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
        }).should.eventually.have.property('data', "Hello text/plain");
    });
    it("should support request body", function() {
        return test.createNetwork({
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
        }).should.eventually.have.property('data', "Hello World");
    });
});
