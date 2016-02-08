// event-component-factory-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var _ = require('underscore');
var noflo = require('noflo');
var componentFactory = require('../src/event-component-factory.js');
var test = require('./common-test');

describe('event-component-factory', function() {
    it("should reject undefined definition", function() {
        return Promise.resolve().then(componentFactory).should.be.rejected;
    });
    it("should trigger in port ondata function", function() {
        var handler;
        return Promise.resolve({
            inPorts:{
                'input':{
                    ondata: function(payload) {
                        handler(payload);
                    }
                }
            }
        }).then(componentFactory).then(test.createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the port is passed to the handler
            return new Promise(function(callback){
                handler = callback;
                var socket = noflo.internalSocket.createSocket();
                component.inPorts.input.attach(socket);
                socket.send("hello");
                socket.disconnect();
                component.inPorts.input.detach(socket);
            });
        }).should.become("hello");
    });
    it("should trigger out port ondata function", function() {
        var handler;
        return Promise.resolve({
            inPorts:{
                'input':{
                    ondata: function(payload) {
                        this.nodeInstance.outPorts.output.connect();
                        this.nodeInstance.outPorts.output.send(payload);
                        this.nodeInstance.outPorts.output.disconnect();
                    }
                }
            },
            outPorts:{
                'output':{
                    ondata: function(payload) {
                        handler(payload);
                    }
                }
            }
        }).then(componentFactory).then(test.createComponent).then(function(component){
            return new Promise(function(callback){
                handler = callback;
                var output = noflo.internalSocket.createSocket();
                component.outPorts.output.attach(output);
                component.outPorts.output.detach(output);
                var input = noflo.internalSocket.createSocket();
                component.inPorts.input.attach(input);
                input.send("hello");
                input.disconnect();
                component.inPorts.input.detach(input);
            });
        }).should.be.fulfilled;
    });
});
