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
            var node = test.createComponent(componentFactory({
                inPorts:{
                    input:{
                        ondata: function(payload) {
                            done(payload);
                        }
                    }
                }
            }));
            test.sendData(node, 'input', "hello");
        }).should.become("hello");
    });
    it("should have name property", function() {
        return new Promise(function(done){
            var node = test.createComponent(componentFactory({
                inPorts:{
                    input:{
                        ondata: function(payload) {
                            done(this.name);
                        }
                    }
                }
            }));
            test.sendData(node, 'input', "hello");
        }).should.become("input");
    });
    it("should have isRequired() function", function() {
        return new Promise(function(done){
            var node = test.createComponent(componentFactory({
                inPorts:{
                    input:{
                        ondata: function(payload) {
                            done(payload + ' ' + this.isRequired());
                        }
                    }
                }
            }));
            test.sendData(node, 'input', "hello");
        }).should.become("hello false");
    });
    it("should map multi: true to addressable: true", function() {
        return new Promise(function(done){
            var node = test.createComponent(componentFactory({
                inPorts:{
                    input:{
                        multi: true,
                        ondata: function(payload) {
                            done(payload + ' ' + this.isMulti());
                        }
                    }
                }
            }));
            test.sendData(node, 'input', "isMulti?");
        }).should.become("isMulti? true");
    });
    it("should map multi: false to addressable: false", function() {
        return new Promise(function(done){
            var node = test.createComponent(componentFactory({
                inPorts:{
                    input:{
                        multi: false,
                        ondata: function(payload) {
                            done(payload + ' ' + this.isMulti());
                        }
                    }
                }
            }));
            test.sendData(node, 'input', "isMulti?");
        }).should.become("isMulti? false");
    });
    it("should have stable nodeInstance property", function() {
        return new Promise(function(done){
            var node = test.createComponent(componentFactory({
                inPorts:{
                    input1:{
                        ondata: function(payload) {
                            if (this.nodeInstance.payload)
                                done(this.nodeInstance.payload + ' ' + payload);
                            else this.nodeInstance.payload = payload;
                        }
                    },
                    input2:{
                        ondata: function(payload) {
                            if (this.nodeInstance.payload)
                                done(this.nodeInstance.payload + ' ' + payload);
                            else this.nodeInstance.payload = payload;
                        }
                    }
                }
            }));
            test.sendData(node, 'input1', "hello");
            test.sendData(node, 'input2', "world");
        }).should.become("hello world");
    });
    it("should trigger out port ondata function", function() {
        return new Promise(function(done){
            var node = test.createComponent(componentFactory({
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
                    output:{
                        ondata: function(payload) {
                            done(payload);
                        }
                    }
                }
            }));
            test.onOutPortData(node, 'output', _.noop);
            test.sendData(node, 'input', "hello");
        }).should.be.fulfilled;
    });
    it("should include socketIndex in ondata function", function() {
        return new Promise(function(done){
            var node = test.createComponent(componentFactory({
                inPorts:{
                    input:{
                        addressable: true,
                        ondata: function(payload, socketIndex) {
                            done(socketIndex);
                        }
                    }
                }
            }));
            test.sendData(node, 'input', "zero");
        }).should.become(0);
    });
    it("should have a nodeName", function() {
        this.timeout(2500);

        var node;
        var instanceId = "testinstance";
        var factoryId = "testfactory";
        var factory = componentFactory({}, function(facade, comp){
            node = facade;
        });
        var graph = new noflo.Graph();
        graph.addNode(instanceId, factoryId);
        return new Promise(function(resolve, reject){
            noflo.createNetwork(graph, function(err, network) {
                if (err instanceof noflo.Network) network = err;
                else if (err) return reject(err);
                network.loader.components[factoryId] = factory;
                network.connect(function(err){
                    if (err) return reject(err);
                    network.start();
                    resolve(network);
                });
            }, true);
        }).then(function(network){
            return node.nodeName;
        }).should.eventually.eql(instanceId);
    });
    it("should have a componentName", function() {
        this.timeout(2500);

        var node;
        var instanceId = "testinstance";
        var factoryId = "testfactory";
        var factory = componentFactory({}, function(facade, comp){
            node = facade;
        });
        var graph = new noflo.Graph();
        graph.addNode(instanceId, factoryId);
        return new Promise(function(resolve, reject){
            noflo.createNetwork(graph, function(err, network) {
                if (err instanceof noflo.Network) network = err;
                else if (err) return reject(err);
                network.loader.components[factoryId] = factory;
                network.connect(function(err){
                    if (err) return reject(err);
                    network.start();
                    resolve(network);
                });
            }, true);
        }).then(function(network){
            return node.componentName;
        }).should.eventually.eql(factoryId);
    });
});
