// join-wrapper-mocha.js
// Unit tests for the APIs defined in src/join-wrapper.js

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var _ = require('underscore');

var createLm = require('../src/create-lm');
var joinWrapper = require('../src/join-wrapper');
var commonWrapper = require('./common-wrapper');
var test = require('./common-test');

var DEFAULT_NUMBER_OF_PORTS = 2;

describe('join-wrapper', function() {

   // Execute the common wrapper tests
   // commonWrapper(joinWrapper, DEFAULT_NUMBER_OF_PORTS);

   describe('Wrapper specific tests', function() {

        describe('#fRunUpdater', function() {

            it("should generate hash & input ports and run updater when passed only an updater", function() {

                var handler;
                var updater = function(hash, input) {
                   handler('success');
                };
                var node = test.createComponent(joinWrapper(updater));

                return new Promise(function(callback){
                    handler = callback;
                    // groupLM of input should always match the lm of the hash
                    // if it went through split -> create an lm and set for both 
                    var lm = createLm(); 
                    test.sendData(node, 
                                  'hash', 
                                  {vnid: '', data: {"1": "one"}, 
                                   error:undefined, stale: undefined, 
                                   groupLm: undefined, lm: lm});
                    test.sendData(node, 
                                  'input', 
                                  {vnid: '1', data: "ONE", 
                                   error:undefined, stale: undefined, 
                                   groupLm: lm, lm: createLm()});
                }).should.become('success');
            });

            it("should trigger wrapper default updater function if no updater specified or port specified", function() {

                var node = test.createComponent(joinWrapper());

                return new Promise(function(done) {
                    test.onOutPortData(node, 'output', done);
                    var lm = createLm();
                    test.sendData(node, 
                                  'vnid_hash', 
                                  {vnid: '', data: {"1": "one"}, 
                                   error:undefined, stale: undefined, 
                                   groupLm: undefined, lm: lm});
                    test.sendData(node, 
                                  'input', 
                                  {vnid: '1', data: "ONE", 
                                   error:undefined, stale: undefined, 
                                   groupLm: lm, lm: createLm()});

                }).then(function(done) {
                    done.should.be.an('object');
                    done.vnid.should.equal('');
                    done.data.should.deep.equal({"1":"ONE"});
                    expect(done.groupLm).to.be.undefined;
                    done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                });
            });

            it("should not trigger updater function with no input data", function() {
                var node =
                    test.createComponent(
                        joinWrapper({
                                     inPorts:{
                                         hash: {required: true},
                                     },
                                     updater: function() {
                                         throw Error('updater ran');
                                     }
                                  })
                   );

                return new Promise(function(done, fail){

                    // Fail if we get output or error:
                    test.onOutPortData(node, 'output', fail);
                    test.onOutPortData(node, 'error', fail);

                    // Send hash, but no input data to join
                    test.sendData(node, 'hash', {"1":"one"});

                    setTimeout(function() { 
                        done();
                    },200);
                });
            });

            it("should call updater with VNI context", function() {
                var handler;
                var updater = function(hash, input) {
                   this.should.have.all.keys('vnid', 'delete', 'inputStates',
                                              'errorState', 'outputState', 'nodeInstance');
                   handler('success');
                };
                var node =
                    test.createComponent(joinWrapper(updater));
   
                return new Promise(function(callback){
                    handler = callback;
                    var lm = createLm();
                    test.sendData(node, 
                                  'hash', 
                                  {vnid: '', data: {"1": "one"}, 
                                   error:undefined, stale: undefined, 
                                   groupLm: undefined, lm: lm});
                    test.sendData(node, 
                                  'input', 
                                  {vnid: '1', data: "ONE", 
                                   error:undefined, stale: undefined, 
                                   groupLm: lm, lm: createLm()});
                }).should.become('success');
            });
        });

        describe('functional behavior', function() {

            it("should execute in a noflo network", function() {
                this.timeout(4000);
                return test.createNetwork(
                    { nodeA: 'rdf-components/parse-json',
                      nodeS: 'rdf-components/simple-splitter',
                      nodeB: 'rdf-components/to-upper-case',
                      nodeJ: { getComponent:
                                  joinWrapper({ inPorts:{ vnid_hash: { required: true },
                                                          input: { required: true }
                                                 },
                                                 updater: function(vnid_hash, input) {
                                                     return {vnid_hash: vnid_hash,
                                                             input: input};
                                                 }
                                  })
                             }
                }).then(function(network) {
                    return new Promise(function(done) {

                        var nodeJ = network.processes.nodeJ.component;
                        test.onOutPortData(nodeJ, 'output', done);

                        network.graph.addEdge('nodeA', 'output', 'nodeS', 'vnid_hash');
                        network.graph.addEdge('nodeA', 'output', 'nodeJ', 'vnid_hash');
                        network.graph.addEdge('nodeS', 'output', 'nodeB', 'string');
                        network.graph.addEdge('nodeB', 'output', 'nodeJ', 'input');

                        var testHash = '{ "1" : "one", "2" : "two", "3" : "three" }';
                        network.graph.addInitial(testHash, 'nodeA', 'input');

                    }).then(function(done) {
                        done.should.be.an('object');
                        done.vnid.should.equal('');
                        done.data.should.deep.equal({ '1': 'ONE', '2': 'TWO', '3': 'THREE' });
                        expect(done.error).to.be.undefined;
                        expect(done.stale).to.be.undefined;
                        expect(done.groupLm).to.be.undefined;
                        done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                    });
                });
            });

            it("should process two hashes sequentially without error", function() {
                this.timeout(4000);
                return test.createNetwork(
                    { nodeA: 'rdf-components/parse-json',
                      nodeA2: 'rdf-components/parse-json',
                      nodeS: 'rdf-components/simple-splitter',
                      nodeB: 'rdf-components/to-upper-case',
                      nodeJ: joinWrapper({ inPorts:{ vnid_hash: { required: true },
                                                          input: { required: true }
                                                 },
                                                 updater: function(vnid_hash, input) {
                                                     return {vnid_hash: vnid_hash,
                                                             input: input};
                                                 }
                             })
                }).then(function(network) {
                    return new Promise(function(done) {

                        var nodeJ = network.processes.nodeJ.component;

                        test.onOutPortData(nodeJ, 'output', done);

                        network.graph.addEdge('nodeA', 'output', 'nodeS', 'vnid_hash');
                        network.graph.addEdge('nodeA', 'output', 'nodeJ', 'vnid_hash');
                        network.graph.addEdge('nodeA2', 'output', 'nodeS', 'vnid_hash');
                        network.graph.addEdge('nodeA2', 'output', 'nodeJ', 'vnid_hash');
                        network.graph.addEdge('nodeS', 'output', 'nodeB', 'string');
                        network.graph.addEdge('nodeB', 'output', 'nodeJ', 'input');

                        var testHash = '{ "1" : "one", "2" : "two", "3" : "three" }';
                        network.graph.addInitial(testHash, 'nodeA', 'input');

                    }).then(function(done) {
                        done.should.be.an('object');
                        done.vnid.should.equal('');
                        done.data.should.deep.equal({ '1': 'ONE', '2': 'TWO', '3': 'THREE' });
                        expect(done.error).to.be.undefined;
                        expect(done.stale).to.be.undefined;
                        expect(done.groupLm).to.be.undefined;
                        done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);

                        return new Promise(function(done2) {

                            var nodeJ = network.processes.nodeJ.component;
                            test.onOutPortData(nodeJ, 'output', done2);
                            network.graph.addInitial( '{ "10" : "ten", "20" : "twenty", "30" : "thirty" }',
                                                      'nodeA2', 'input');

                        }).then(function(done2) {
                            done2.should.be.an('object');
                            done2.vnid.should.equal('');
                            done2.data.should.deep.equal({ '10': 'TEN', '20': 'TWENTY', '30': 'THIRTY' });
                            expect(done2.error).to.be.undefined;
                            expect(done2.stale).to.be.undefined;
                            expect(done2.groupLm).to.be.undefined;
                            done2.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                        });
                    });

                });
            });

            it("should get the right hash when given more than one", function() {
                this.timeout(4000);
                var count = 0;
                return test.createNetwork(
                    { nodeA: 'rdf-components/parse-json',
                      nodeO: 'rdf-components/parse-json',
                      nodeS: 'rdf-components/simple-splitter',
                      nodeB: 'rdf-components/to-upper-case',
                      nodeJ:  joinWrapper({ inPorts:{ vnid_hash: { required: true },
                                                          other_hash: { required: true },
                                                          input: { required: true }
                                                 },
                                                 updater: function(vnid_hash, input, other_hash) {
                                                     // This updater combines the keys of other_hash
                                                     // with the input from the split & processed vnid_hash
                                                     var keys = Object.keys(other_hash);
                                                     return {vnid_hash: vnid_hash,
                                                             input: input + ' & ' + other_hash[keys[count++]] };
                                                 }
                             })
                }).then(function(network) {
                    return new Promise(function(done) {

                        var nodeJ = network.processes.nodeJ.component;
                        test.onOutPortData(nodeJ, 'output', done);

                        network.graph.addEdge('nodeA', 'output', 'nodeS', 'vnid_hash');
                        network.graph.addEdge('nodeA', 'output', 'nodeJ', 'vnid_hash');
                        network.graph.addEdge('nodeO', 'output', 'nodeJ', 'other_hash');
                        network.graph.addEdge('nodeS', 'output', 'nodeB', 'string');
                        network.graph.addEdge('nodeB', 'output', 'nodeJ', 'input');

                        var splitHash = '{ "1" : "one", "2" : "two", "3" : "three"}';
                        network.graph.addInitial(splitHash, 'nodeA', 'input');

                        var otherHash = '{ "10" : "TEN", "20" : "TWENTY", "30": "THIRTY"}';
                        network.graph.addInitial(otherHash, 'nodeO', 'input');

                    }).then(function(done) {
                        done.vnid.should.equal('');
                        done.data.should.deep.equal({ '1': 'ONE & TEN', '2': 'TWO & TWENTY', '3': 'THREE & THIRTY' }); 
                        expect(done.error).to.be.undefined;
                        expect(done.stale).to.be.undefined;
                        expect(done.groupLm).to.be.undefined;
                        done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                    });
                });
            });

            it("should process two hashes in parallel without error", function() {
                this.timeout(4000);
                return test.createNetwork(
                    { nodeA: 'rdf-components/parse-json',
                      nodeA2: 'rdf-components/parse-json',
                      nodeS: 'rdf-components/simple-splitter',
                      nodeB: 'rdf-components/to-upper-case',
                      nodeJ:  joinWrapper({ inPorts:{ vnid_hash: { required: true },
                                                          input: { required: true }
                                                 },
                                                 updater: function(vnid_hash, input) {
                                                     return {vnid_hash: vnid_hash,
                                                             input: input};
                                                 }
                              })
                }).then(function(network) {
                    return new Promise(function(done) {

                        var nodeJ = network.processes.nodeJ.component;

                        test.onOutPortData(nodeJ, 'output', done);

                        network.graph.addEdge('nodeA', 'output', 'nodeS', 'vnid_hash');
                        network.graph.addEdge('nodeA', 'output', 'nodeJ', 'vnid_hash');
                        network.graph.addEdge('nodeA2', 'output', 'nodeS', 'vnid_hash');
                        network.graph.addEdge('nodeA2', 'output', 'nodeJ', 'vnid_hash');
                        network.graph.addEdge('nodeS', 'output', 'nodeB', 'string');
                        network.graph.addEdge('nodeB', 'output', 'nodeJ', 'input');

                        network.graph.addInitial('{ "1" : "one", "2" : "two", "3" : "three" }',
                                                 'nodeA', 'input');

                        network.graph.addInitial( '{ "10" : "ten", "20" : "twenty", "30" : "thirty" }',
                                                  'nodeA2', 'input');

                    }).then(function(done) {
                        done.should.be.an('object');
                        done.vnid.should.equal('');
                        done.data.should.deep.equal({ '1': 'ONE', '2': 'TWO', '3': 'THREE',
                                                      '10': 'TEN', '20': 'TWENTY', '30': 'THIRTY' });
                        expect(done.error).to.be.undefined;
                        expect(done.stale).to.be.undefined;
                        expect(done.groupLm).to.be.undefined;
                        done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                    });

                });
            });

        });
   });
});
