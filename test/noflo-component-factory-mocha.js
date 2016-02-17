// event-component-factory-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var _ = require('underscore');
var noflo = require('noflo');
var componentFactory = require('../src/noflo-component-factory.js');
var test = require('./common-test');

describe('noflo-component-factory', function() {
    it("should reject undefined definition", function() {
        return Promise.resolve().then(componentFactory).should.be.rejected;
    });
    it("should trigger in port ondata function", function() {
        return new Promise(function(done){
            var component = test.createComponent(componentFactory({
                inPorts:{
                    'input':{
                        ondata: function(payload) {
                            done(payload);
                        }
                    }
                }
            }));
            var socket = noflo.internalSocket.createSocket();
            component.inPorts.input.attach(socket);
            socket.send("hello");
            socket.disconnect();
            component.inPorts.input.detach(socket);
        }).should.become("hello");
    });
    it("should trigger out port ondata function", function() {
        return new Promise(function(done){
            var component = test.createComponent(componentFactory({
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
                            done(payload);
                        }
                    }
                }
            }));
            var output = noflo.internalSocket.createSocket();
            component.outPorts.output.attach(output);
            var input = noflo.internalSocket.createSocket();
            component.inPorts.input.attach(input);
            input.send("hello");
            input.disconnect();
            component.inPorts.input.detach(input);
            component.outPorts.output.detach(output);
        }).should.be.fulfilled;
    });
    it("should include socketIndex in ondata function", function() {
        return new Promise(function(done){
            var component = test.createComponent(componentFactory({
                inPorts:{
                    'input':{
                        addressable: true,
                        ondata: function(payload, socketIndex) {
                            done(socketIndex);
                        }
                    }
                }
            }));
            var socket = noflo.internalSocket.createSocket();
            component.inPorts.input.attach(socket);
            socket.send("zero");
            socket.disconnect();
            component.inPorts.input.detach(socket);
        }).should.become(0);
    });
});
