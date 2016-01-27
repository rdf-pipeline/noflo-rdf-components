// promise-component-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var _ = require('underscore');
var noflo = require('noflo');
var promiseComponent = require('../components/promise-component.js');

describe('promise-component', function() {
    it("should reject undefined definition", function() {
        return Promise.resolve().then(promiseComponent).should.be.rejected;
    });
    it("should reject empty definition", function() {
        return Promise.resolve({}).then(promiseComponent).should.be.rejected;
    });
    it("should reject empty inPorts", function() {
        return Promise.resolve({inPorts:{}}).then(promiseComponent).should.be.rejected;
    });
    it("should reject empty resolvePort", function() {
        return Promise.resolve({inPorts:{in:{}},resolvePort:{}}).then(promiseComponent).should.be.rejected;
    });
    it("should reject empty rejectPort", function() {
        return Promise.resolve({inPorts:{in:{}},rejectPort:{}}).then(promiseComponent).should.be.rejected;
    });
    it("should trigger ondata function", function() {
        var handler;
        return Promise.resolve({
            inPorts:{
                'in':{
                    ondata: function(payload) {
                        handler(payload);
                    }
                }
            }
        }).then(promiseComponent).then(createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            return new Promise(function(callback){
                handler = callback;
                sendData(component, 'in', "hello");
            });
        }).should.become("hello");
    });
    it("should resolve ondata function", function() {
        return Promise.resolve({
            inPorts:{
                'in':{
                    ondata: function(payload) {
                        return payload + " world";
                    }
                }
            }
        }).then(promiseComponent).then(createComponent).then(function(component){
            return onceData(component, 'out', 'error', 'in', "hello");
        }).should.become("hello world");
    });
    it("should reject ondata function", function() {
        return Promise.resolve({
            inPorts:{
                'in':{
                    ondata: function(payload) {
                        throw payload + " world";
                    }
                }
            }
        }).then(promiseComponent).then(createComponent).then(function(component){
            return onceData(component, 'out', 'error', 'in', "hello");
        }).should.be.rejectedWith("hello world");
    });
    it("should resolve ondata function on custom inPort name", function() {
        return Promise.resolve({
            inPorts:{
                incoming:{
                    ondata: function(payload) {
                        return payload + " world";
                    }
                }
            }
        }).then(promiseComponent).then(createComponent).then(function(component){
            return onceData(component, 'out', 'error', 'incoming', "hello");
        }).should.become("hello world");
    });
    it("should resolve ondata function on custom resolve port name", function() {
        return Promise.resolve({
            inPorts:{
                incoming:{
                    ondata: function(payload) {
                        return payload + " world";
                    }
                }
            },
            resolvePort: {
                name: 'outgoing'
            }
        }).then(promiseComponent).then(createComponent).then(function(component){
            return onceData(component, 'outgoing', 'error', 'incoming', "hello");
        }).should.become("hello world");
    });
    it("should reject ondata function on custom reject port name", function() {
        return Promise.resolve({
            inPorts:{
                incoming:{
                    ondata: function(payload) {
                        throw payload + " world";
                    }
                }
            },
            resolvePort: {
                name: 'outgoing'
            },
            rejectPort: {
                name: 'sentback'
            }
        }).then(promiseComponent).then(createComponent).then(function(component){
            return onceData(component, 'outgoing', 'sentback', 'incoming', "hello");
        }).should.be.rejectedWith("hello world");
    });
    it("should log rejections to console.error when no reject port attached", function() {
        return Promise.resolve({
            inPorts:{
                'in':{
                    ondata: function(payload) {
                        throw payload + " world";
                    }
                }
            }
        }).then(promiseComponent).then(createComponent).then(function(component){
            var console_error = console.error;
            return new Promise(function(resolve, reject) {
                console.error = reject;
                var out = noflo.internalSocket.createSocket();
                component.outPorts.out.attach(out);
                out.once('data', resolve);
                sendData(component, 'in', "hello");
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
    function onceData(component, resolvePort, rejectPort, sendPort, sendPayload) {
        return new Promise(function(resolve, reject) {
            var out = noflo.internalSocket.createSocket();
            var error = noflo.internalSocket.createSocket();
            component.outPorts[resolvePort].attach(out);
            component.outPorts[rejectPort].attach(error);
            out.once('data', resolve);
            error.once('data', reject);
            sendData(component, sendPort, sendPayload);
        });
    }
});
