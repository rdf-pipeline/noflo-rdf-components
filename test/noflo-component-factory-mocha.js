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
                    input:{
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
    it("should behave like an EventEmitter", function() {
        return new Promise(function(done, fail){
            var handler = function(payload){
                done(payload + ' ' + this.name);
            };
            var component = test.createComponent(componentFactory({
                inPorts:{
                    input1:{
                        ondata: function(payload) {
                            this.on('change', fail);
                            this.removeListener('change', fail);
                            this.on('change', handler);
                        }
                    },
                    input2:{
                        ondata: function(payload) {
                            this.on('change', handler);
                            this.emit('change', payload);
                        }
                    }
                }
            }));
            var input1 = noflo.internalSocket.createSocket();
            component.inPorts.input1.attach(input1);
            input1.send("hi");
            input1.disconnect();
            component.inPorts.input1.detach(input1);
            var input2 = noflo.internalSocket.createSocket();
            component.inPorts.input2.attach(input2);
            input2.send("hello");
            input2.disconnect();
            component.inPorts.input2.detach(input2);
        }).should.become("hello input2");
    });
    it("should have name property", function() {
        return new Promise(function(done){
            var component = test.createComponent(componentFactory({
                inPorts:{
                    input:{
                        ondata: function(payload) {
                            done(this.name);
                        }
                    }
                }
            }));
            var socket = noflo.internalSocket.createSocket();
            component.inPorts.input.attach(socket);
            socket.send("hello");
            socket.disconnect();
            component.inPorts.input.detach(socket);
        }).should.become("input");
    });
    it("should have isAddressable() function", function() {
        return new Promise(function(done){
            var component = test.createComponent(componentFactory({
                inPorts:{
                    input:{
                        description: "World",
                        ondata: function(payload) {
                            done(payload + ' ' + this.isAddressable());
                        }
                    }
                }
            }));
            var socket = noflo.internalSocket.createSocket();
            component.inPorts.input.attach(socket);
            socket.send("hello");
            socket.disconnect();
            component.inPorts.input.detach(socket);
        }).should.become("hello false");
    });
    it("should have stable nodeInstance property", function() {
        return new Promise(function(done){
            var component = test.createComponent(componentFactory({
                inPorts:{
                    'input1':{
                        ondata: function(payload) {
                            if (this.nodeInstance.payload)
                                done(this.nodeInstance.payload + ' ' + payload);
                            else this.nodeInstance.payload = payload;
                        }
                    },
                    'input2':{
                        ondata: function(payload) {
                            if (this.nodeInstance.payload)
                                done(this.nodeInstance.payload + ' ' + payload);
                            else this.nodeInstance.payload = payload;
                        }
                    }
                }
            }));
            var input1 = noflo.internalSocket.createSocket();
            var input2 = noflo.internalSocket.createSocket();
            component.inPorts.input1.attach(input1);
            component.inPorts.input1.attach(input2);
            input1.send("hello");
            input1.disconnect();
            input2.send("world");
            input2.disconnect();
            component.inPorts.input1.detach(input1);
            component.inPorts.input1.detach(input2);
        }).should.become("hello world");
    });
    it("should trigger out port ondata function", function() {
        return new Promise(function(done){
            var component = test.createComponent(componentFactory({
                inPorts:{
                    input:{
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
                    input:{
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
