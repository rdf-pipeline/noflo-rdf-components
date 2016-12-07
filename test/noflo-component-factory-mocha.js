// noflo-component-factory-mocha.js

var chai = require('chai');
var expect = chai.expect;
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
	this.timeout(4000);
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
	this.timeout(4000);
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
    it("should have nodeInstance isTranslator flag that defaults to false", function() {
        return new Promise(function(done){
            var node = test.createComponent(componentFactory({
                inPorts:{
                    input:{
                        ondata: function(payload) {
                            done(payload + ' ' + this.nodeInstance.isTranslator);
                        }
                    }
                }
            }));
            test.sendData(node, 'input', "isTranslator?");
        }).should.become("isTranslator? false");
    });

    it("should have isTranslator flag that can be set to true", function() {
        return new Promise(function(done){
            var node = test.createComponent(componentFactory({
                isTranslator: true,
                inPorts:{
                    input:{
                        ondata: function(payload) {
                            done(payload + ' ' + this.nodeInstance.isTranslator);
                        }
                    }
                }
            }));

            test.sendData(node, 'input', "isTranslator?");
        }).should.become("isTranslator? true");
    });

    it("should have nodeInstance transient flag that defaults to false", function() {
        return new Promise(function(done){
            var node = test.createComponent(componentFactory({
                inPorts:{
                    input:{
                        ondata: function(payload) {
                            done(payload + ' ' + this.nodeInstance.transient);
                        }
                    }
                }
            }));

            test.sendData(node, 'input', "transient?");
        }).should.become("transient? false");
    });

    it("should have transient flag that can be set to true", function() {
        return new Promise(function(done){
            var node = test.createComponent(componentFactory({
                transient: true,
                inPorts:{
                    input:{
                        ondata: function(payload) {
                            done(payload + ' ' + this.nodeInstance.transient);
                        }
                    }
                }
            }));

            test.sendData(node, 'input', "transient?");
        }).should.become("transient? true");
    });

    it("should have nodeInstance transient flag that defaults to false", function() {
        return new Promise(function(done){
            var node = test.createComponent(componentFactory({
                transient: false,
                inPorts:{
                    input:{
                        ondata: function(payload) {
                            done(payload + ' ' + this.nodeInstance.transient);
                        }
                    }
                }
            }));

            test.sendData(node, 'input', "transient?");
        }).should.become("transient? false");
    });

    it("should set transient flag to global pipeline transient setting if no node flag exists", function() {
        return new Promise(function(done){
            process['nofloGraph'] = {properties: {
                                         rdfPipeline: {transient: true} 
                                     }
            };

            var node = test.createComponent(componentFactory({
                inPorts:{
                    input:{
                        ondata: function(payload) {
                            done(payload + ' ' + this.nodeInstance.transient);
                        }
                    }
                }
            }));

            test.sendData(node, 'input', "transient?");
        }).should.become("transient? true");
    });

    it("should override global pipeline transient setting with the node setting if both exist", function() {
        return new Promise(function(done){
            process['nofloGraph'] = {properties: {
                                         rdfPipeline: {transient: false} 
                                     }
            };

            var node = test.createComponent(componentFactory({
                transient: true,
                inPorts:{
                    input:{
                        ondata: function(payload) {
                            done(payload + ' ' + this.nodeInstance.transient);
                        }
                    }
                }
            }));

            test.sendData(node, 'input', "transient?");
        }).should.become("transient? true");
    });
    it("should have an isSingleIIP function that returns false if port is configured with an edge only", function() {
	this.timeout(16000);
        return test.createNetwork(
            { inputNode: 'core/Repeat',
              testNode: componentFactory({inPorts:{
                            input:{
                                ondata: function(payload) {
                                    expect(this.isSingleIIP()).to.be.false;
                                    done();
                                }
                            }
                        }
              })
        }).then(function(network) {

            network.graph.addEdge('inputNode', 'out', 'testNode', 'input');
            network.graph.addInitial("I get no kick from champagne", 'inputNode', 'in');
        });
    });

    it("should have isSingleIIP function that returns true if port is configured with an IIP only", function() {
        return new Promise(function(done){
            var node = test.createComponent(componentFactory({
                inPorts:{
                    input:{
                        ondata: function(payload) {
                            expect(this.isSingleIIP()).to.be.true;
                            done();
                        }
                    }
                }
            }));

	    test.sendData(node, 'input', "I get a kick out of you");
        });
    });

    it("should have an isSingleIIP function that returns false if port is configured with an edge & IIP", function() {
	this.timeout(8000);
        var count = 0;
        return test.createNetwork(
            { inputNode: 'core/Repeat',
              testNode: componentFactory({inPorts:{
                            input:{
                                ondata: function(payload) {
                                    expect(this.isSingleIIP()).to.be.false;
                                    if (++count == 2) {
                                        done();
                                    } 
                                }
                            }
                        }
              })
        }).then(function(network) {

            network.graph.addEdge('inputNode', 'out', 'testNode', 'input');
            network.graph.addInitial("When I'm out on a quiet spree", 'testNode', 'input');
            network.graph.addInitial("Fighting vainly the old ennui", 'inputNode', 'in');
        });
    });
});
