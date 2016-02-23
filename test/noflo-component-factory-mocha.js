// noflo-component-factory-mocha.js

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
            test.sendData(component, 'input', "hello");
        }).should.become("hello");
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
            test.sendData(component, 'input', "hello");
        }).should.become("input");
    });
    it("should have isRequired() function", function() {
        return new Promise(function(done){
            var component = test.createComponent(componentFactory({
                inPorts:{
                    input:{
                        ondata: function(payload) {
                            done(payload + ' ' + this.isRequired());
                        }
                    }
                }
            }));
            test.sendData(component, 'input', "hello");
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
            test.sendData(component, 'input1', "hello");
            test.sendData(component, 'input2', "world");
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
            test.sendData(component, 'input', "hello");
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
            test.sendData(component, 'input', "zero");
        }).should.become(0);
    });
});
