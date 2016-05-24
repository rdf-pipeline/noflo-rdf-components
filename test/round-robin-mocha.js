// round-robin-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var _ = require('underscore');
var path = require('path');
var noflo = require('noflo');
var test = require('./common-test');
var roundRobin = require('../components/round-robin');

describe('round-robin', function() {
    it("should echo data", function() {
        this.timeout(3500);
        return test.createNetwork({
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
        this.timeout(3000);
        return test.createNetwork({
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
        this.timeout(3500);
        return test.createNetwork({
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
