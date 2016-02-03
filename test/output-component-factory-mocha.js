// output-component-factory-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var _ = require('underscore');
var noflo = require('noflo');
var componentFactory = require('../components/output-component-factory');

describe('output-component-factory', function() {
    it("should accept array of inPort names", function() {
        return Promise.resolve({
            inPorts:['input'],
            onchange:function(){}
        }).then(componentFactory).then(createComponent).then(function(component){
            return _.keys(component.inPorts);
        }).should.eventually.contain('input');
    });
    it("should resolve onchange function", function() {
        return Promise.resolve({
            inPorts:['input'],
            onchange: function(payloads) {
                return payloads.input + " world";
            }
        }).then(componentFactory).then(createComponent).then(function(component){
            return onceData(component, 'input', "hello");
        }).should.become("hello world");
    });
    it("should send multiple packets on array result for onchange function", function() {
        return Promise.resolve({
            inPorts:['input'],
            onchange: function(payloads) {
                return [payloads.input, payloads.input + " world"];
            }
        }).then(componentFactory).then(createComponent).then(function(component){
            return new Promise(function(resolve) {
                var output = noflo.internalSocket.createSocket();
                component.outPorts.output.attach(output);
                output.once('data', function(){
                    output.once('data', resolve);
                });
                sendData(component, 'input', "hello");
            });
        }).should.become("hello world");
    });
    it("should reject onchange function", function() {
        return Promise.resolve({
            inPorts:['input'],
            onchange: function(payloads) {
                throw payloads.input + " world";
            }
        }).then(componentFactory).then(createComponent).then(function(component){
            return onceData(component, 'input', "hello");
        }).should.be.rejectedWith("hello world");
    });
    it("should log rejections to console.error when no reject port attached", function() {
        return Promise.resolve({
            inPorts:['input'],
            onchange: function(payloads) {
                throw payloads.input + " world";
            }
        }).then(componentFactory).then(createComponent).then(function(component){
            var console_error = console.error;
            return new Promise(function(resolve, reject) {
                console.error = reject;
                var output = noflo.internalSocket.createSocket();
                component.outPorts.output.attach(output);
                output.once('data', resolve);
                sendData(component, 'input', "hello");
            }).then(function(resolved) {
                console.error = console_error;
                return resolved;
            }, function(rejected){
                console.error = console_error;
                throw rejected;
            });
        }).should.be.rejectedWith("hello world");
    });
    function createComponent(getComponent) {
        var component = getComponent();
        _.forEach(component.inPorts, function(port, name) {
            port.nodeInstance = component;
            port.name = name;
        });
        _.forEach(component.outPorts, function(port, name) {
            port.nodeInstance = component;
            port.name = name;
        });
        return component;
    }
    function sendData(component, port, payload) {
        var socket = noflo.internalSocket.createSocket();
        component.inPorts[port].attach(socket);
        socket.send(payload);
        socket.disconnect();
        component.inPorts[port].detach(socket);
    }
    function onceData(component, sendPort, sendPayload) {
        return new Promise(function(resolve, reject) {
            var output = noflo.internalSocket.createSocket();
            var error = noflo.internalSocket.createSocket();
            component.outPorts.output.attach(output);
            component.outPorts.error.attach(error);
            output.once('data', resolve);
            error.once('data', reject);
            sendData(component, sendPort, sendPayload);
        });
    }
});
