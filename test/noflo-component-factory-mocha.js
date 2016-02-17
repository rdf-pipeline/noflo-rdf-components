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
    it("should behave like an EventEmitter", function() {
        return new Promise(function(done, fail){
            var component = test.createComponent(componentFactory({
                inPorts:{
                    'input':{
                        ondata: function(payload) {
                            this.on('change', fail);
                            this.removeListener('change', fail);
                            this.on('change', done);
                            this.emit('change', payload);
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
    it("should have name property", function() {
        return new Promise(function(done){
            var component = test.createComponent(componentFactory({
                inPorts:{
                    'input':{
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
    it("should have getDescription() function", function() {
        return new Promise(function(done){
            var component = test.createComponent(componentFactory({
                inPorts:{
                    'input':{
                        description: "World",
                        ondata: function(payload) {
                            done(payload + ' ' + this.getDescription());
                        }
                    }
                }
            }));
            var socket = noflo.internalSocket.createSocket();
            component.inPorts.input.attach(socket);
            socket.send("hello");
            socket.disconnect();
            component.inPorts.input.detach(socket);
        }).should.become("hello World");
    });
    it("should have nodeInstance.getDescription() function", function() {
        return new Promise(function(done){
            var component = test.createComponent(componentFactory({
                description: "World",
                inPorts:{
                    'input':{
                        ondata: function(payload) {
                            done(payload + ' ' + this.nodeInstance.getDescription());
                        }
                    }
                }
            }));
            var socket = noflo.internalSocket.createSocket();
            component.inPorts.input.attach(socket);
            socket.send("hello");
            socket.disconnect();
            component.inPorts.input.detach(socket);
        }).should.become("hello World");
    });
    it("should have stable nodeInstance.rpf property", function() {
        return new Promise(function(done){
            var component = test.createComponent(componentFactory({
                inPorts:{
                    'input1':{
                        ondata: function(payload) {
                            if (this.nodeInstance.rpf.payload)
                                done(this.nodeInstance.rpf.payload + ' ' + payload);
                            else this.nodeInstance.rpf.payload = payload;
                        }
                    },
                    'input2':{
                        ondata: function(payload) {
                            if (this.nodeInstance.rpf.payload)
                                done(this.nodeInstance.rpf.payload + ' ' + payload);
                            else this.nodeInstance.rpf.payload = payload;
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
