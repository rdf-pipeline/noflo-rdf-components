// phaser-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var _ = require('underscore');
var path = require('path');
var noflo = require('noflo');
var test = require('./common-test');
var phaser = require('../components/phaser');

describe('phaser', function() {
    it("should pass data through without registration", function() {
        this.timeout(3000);
        return test.createNetwork({
            phaser: phaser
        }).then(function(network){
            var output = noflo.internalSocket.createSocket();
            network.processes.phaser.component.outPorts.output.attach(output);
            return new Promise(function(done) {
                output.on('data', done);
                network.graph.addInitial("Hello World", 'phaser', 'input');
            });
        }).should.become("Hello World");
    });
    it("should wait until arrival", function() {
        this.timeout(3000);
        return test.createNetwork({
            phaser: phaser
        }).then(function(network){
            var output = noflo.internalSocket.createSocket();
            network.processes.phaser.component.outPorts.output.attach(output);
            return new Promise(function(done, fail) {
                output.on('data', fail);
                network.graph.addInitial('wait', 'phaser', 'register');
                network.graph.addInitial("Hello World", 'phaser', 'input');
                output.removeListener('data', fail);
                network.graph.addInitial('ready', 'phaser', 'arrive');
                output.on('data', done);
            });
        }).should.become("Hello World");
    });
    it("should wait until everything arrives", function() {
        this.timeout(3000);
        return test.createNetwork({
            phaser: phaser
        }).then(function(network){
            var output = noflo.internalSocket.createSocket();
            network.processes.phaser.component.outPorts.output.attach(output);
            return new Promise(function(done, fail) {
                output.on('data', fail);
                network.graph.addInitial('once', 'phaser', 'register');
                network.graph.addInitial("Hello World", 'phaser', 'input');
                network.graph.addInitial('twice', 'phaser', 'register');
                network.graph.addInitial('first', 'phaser', 'arrive');
                output.removeListener('data', fail);
                network.graph.addInitial('second', 'phaser', 'arrive');
                output.on('data', done);
            });
        }).should.become("Hello World");
    });
});
