/**
 * File: split-wrapper-mocha.js
 *
 * Unit tests for the APIs defined in src/split-wrapper.js
 */

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

var logger = require('../src/logger');

var _ = require('underscore');

var splitWrapper = require('../src/split-wrapper');

var commonWrapper = require('./common-wrapper');
var commonTest = require('./common-test');

var DEFAULT_NUMBER_OF_PORTS = 1;

describe('split-wrapper', function() {
   commonWrapper(splitWrapper, DEFAULT_NUMBER_OF_PORTS);

   describe('Wrapper specific tests', function() {

        describe('#fRunUpdater', function() {

            it("should fail if not given a vnid hash", function() {

                return new Promise(function(done) {
                    var node = commonTest.createComponent(splitWrapper({ inPorts:['vnid_hash'] }));
                    commonTest.onOutPortData(node, 'output', done);
                    logger.silence('error');
                    commonTest.sendData(node, 'vnid_hash', "A test input string");
                }).then(function(done) {
                   logger.verbose('warn');
                   done.should.be.an('object');
                   done.vnid.should.equal('');
                   done.error.should.be.true;
                   expect(done.stale).to.be.undefined;
                });
            });

            it("should generate vnid hash port and run updater when passed only an updater", function() {
     

                var handler;
                var updater = function(hash) {
                   handler('success');
                };
                var node = commonTest.createComponent(splitWrapper(updater));

                return new Promise(function(callback){
                    handler = callback;
                    commonTest.sendData(node, 'hash', {"1": "one"});
                }).should.become('success');
            });

            it("should trigger wrapper updater function if no updater specified", function() {

                var node = commonTest.createComponent(splitWrapper({ inPorts:['vnid_hash'] }));

                return new Promise(function(done, fail) {
                    commonTest.onOutPortData(node, 'output', done);
                    commonTest.onOutPortData(node, 'error', fail);

                    commonTest.sendData(node, 'vnid_hash', {"1":"one"});

                }).then(function(done) {

                    done.should.be.an('object');
                    done.vnid.should.equal('1');
                    done.data.should.equal('one');
                    expect(done.error).to.be.undefined;
                    expect(done.stale).to.be.undefined;
                    done.groupLm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                    done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);

                }, function(fail) {
                    assert.isNotOk(fail);
                });
            });

            it("should trigger updater function with no input parameters", function() {

                var handler;
                var node =
                    commonTest.createComponent(
                        splitWrapper({
                                     inPorts:{
                                         hash: {required: true},
                                     },
                                     updater: function() {
                                         handler('success');
                                     }
                                  })
                    );

                return new Promise(function(callback){
                    handler = callback;
                    commonTest.sendData(node, 'hash', {"1":"one"});
                }).should.become('success');
            });

            it("should trigger updater function even when cannot introspect it", function() {

                var handler;
                var testArg = "testArg";

                // bind function to the current context and pass argument "testArg";
                // this function cannot be introspected
                var updater = (function(arg1){
                     arg1.should.equal(testArg);
                     handler('success');
                }).bind(this, testArg);

                var node =
                    commonTest.createComponent(
                        splitWrapper({
                                    inPorts:{
                                        vnid_hash: {required: true}
                                    },
                                    updater: updater
                        })
                    );

                return new Promise(function(callback){
                    handler = callback;
                    commonTest.sendData(node, 'vnid_hash', {"1":"one"});
                }).should.become('success');
            });


            it("should call updater with VNI context", function() {
                var handler;
                var updater = function(input) {
                   this.should.have.all.keys('vnid', 'clearTransientInputs',
                                             'delete', 'inputStates',
                                             'errorState', 'outputState', 'nodeInstance');
                   handler('success');
                };
                var node =
                    commonTest.createComponent(splitWrapper(updater));
   
                return new Promise(function(callback){
                    handler = callback;
                    commonTest.sendData(node, 'input', {"1":"one"});
                }).should.become('success');
            });

        });

        describe('functional behavior', function() {

            it("should execute in a noflo network", function() {
                this.timeout(4000);
                return commonTest.createNetwork(
                    { nodeA: 'rdf-components/parse-json',
                      nodeS: { getComponent:
                                  splitWrapper({ inPorts:{ vnid_hash: { required: true } },
                                                 updater: function(vnid_hash) {
                                                     for (var key in vnid_hash) {
                                                         vnid_hash[key] = vnid_hash[key].toUpperCase();
                                                     }
                                                     return vnid_hash;
                                                 }
                                  })
                             }
                }).then(function(network) {
                    return new Promise(function(done) {

                        var nodeA = network.processes.nodeA.component;
                        var nodeS = network.processes.nodeS.component;

                        commonTest.onOutPortData(nodeS, 'output', done);

			network.graph.addEdge('nodeA', 'output', 'nodeS', 'vnid_hash');

                        network.graph.addInitial('{"1":"one"}', 'nodeA', 'input');

                    }).then(function(done) {
                        done.vnid.should.equal('1');
                        done.data.should.equal("ONE");
                        expect(done.error).to.be.undefined;
                        expect(done.stale).to.be.undefined;
                        done.groupLm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                        done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);

                    });
                });
            });

            it("should send multiple messages with a multi-element hash in a noflo network", function() {
                this.timeout(3750);
                var count = 0;
                return commonTest.createNetwork(
                    { nodeA: 'rdf-components/parse-json',
                      nodeS: { getComponent:
                                  splitWrapper({ inPorts:{ vnid_hash: { required: true } },
                                                 updater: function(vnid_hash) {
                                                     return vnid_hash;
                                                 }
                                  })
                             }
                }).then(function(network) {
                    return new Promise(function(done) {

                        var nodeA = network.processes.nodeA.component;
                        var nodeS = network.processes.nodeS.component;

                        var countSends = function() { 
                            count++;
                            if (count === 3) { 
                                done();
                            }
                        };
                        commonTest.onOutPortData(nodeS, 'output', countSends);

			network.graph.addEdge('nodeA', 'output', 'nodeS', 'vnid_hash');

                        network.graph.addInitial('{"1":"one","2":"two","3":"three"}', 'nodeA', 'input');
                        setTimeout(done, 1000);

                    }).then(function(done) {
                        count.should.equal(3);
                    });
                });
            });

            it("should call updater with extra parameters", function() {
                this.timeout(4250);
                var testString = 'This little piggy stayed home';
                return commonTest.createNetwork(
                    { nodeA: 'rdf-components/parse-json',
                      nodeS: { getComponent:
                                  splitWrapper({ updater: function(hash, arg) {
                                                     if (_.isEmpty(hash) || _.isEmpty(arg)) {
                                                        throw Error('Did not receive expected updater arguments');
                                                     }
                                                     var vnid = Object.keys(hash)[0];
                                                     hash[vnid] = arg;
                                                     return hash;
                                                 }
                                  })
                             }

                }).then(function(network) {
                    return new Promise(function(done) {

                        var nodeA = network.processes.nodeA.component;
                        var nodeS = network.processes.nodeS.component;

                        commonTest.onOutPortData(nodeS, 'output', done);

			network.graph.addEdge('nodeA', 'output', 'nodeS', 'hash');

                        network.graph.addInitial('{"1":"one"}', 'nodeA', 'input');
                        network.graph.addInitial(testString, 'nodeS', 'arg');

                    }).then(function(done) {
                        done.vnid.should.equal('1');
                        done.data.should.equal(testString);  
                        expect(done.error).to.be.undefined;
                        expect(done.stale).to.be.undefined;
                        done.groupLm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                        done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                        done.groupLm.should.not.equal(done.lm);
                    });
                });
            });

       });
   });
});
