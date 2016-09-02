/**
 * File: framework-ondata-mocha.js
 * Unit tests for the framework-ondata APIs 
 */

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();
chai.use(chaiAsPromised);

var sinon = require('sinon');

var noflo = require('noflo');

var createLm = require('../src/create-lm');
var framework_ondata = require('../src/framework-ondata');
var factory = require('../src/pipeline-component-factory');
var jswrapper = require('../src/javascript-wrapper');
var stateFactory = require('../src/create-state');
var logger = require('../src/logger');
var test = require('./common-test');

describe("framework-ondata", function() {

    it("should exist as a function", function() {
      framework_ondata.should.exist;
      framework_ondata.should.be.a('function');
    });

    describe("#ondata", function() {

        it("should throw error if no wrapper fRunUpdater configured", function() {

            var inData = "A bit of input data";

            // Create a pipeline component and get the node instance for it
            var node = test.createComponent(
                factory({
                          description: "Test Description",
                          inPorts: {
                              input: {
                                  datatype: 'string',
                                  description: "a string port",
                                  required: true
                              }
                          }
                        })
           );

            // We use a promise here because this section is asynchronous
            return new Promise(function(done, fail) {
                // Send some data to the input port
                test.onOutPortData(node, 'output', done);
                test.onOutPortData(node, 'error', fail);
                sinon.stub(logger, 'error');
                test.sendData(node, 'input', inData);
            }).then(function(done) { 
                logger.error.restore();
                throw Error("framework did not throw error when wrapper fRunUpdater was not configured!");
            }, function(fail) { 
                logger.error.restore();
                fail.toString().should.contain('Error: No wrapper fRunUpdater function found!  Cannot run updater.');
                
            });

should.be.rejectedWith('No wrapper fRunUpdater function found!  Cannot run updater.');
        });

        it("should manage single port node vni state, fRunUpdater invocation, & output state", function() {

            var inData = "A bit of input data";
            var executedFRunUpdater = "Executed fRunUpdater API";

            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function(vni) { 
                // update state
                vni.outputState({data: executedFRunUpdater, lm: createLm()});
            }

            // Create a pipeline component and get the node instance for it
            var wrapper = { fRunUpdater: fRunUpdater };
            var node = test.createComponent(
                factory({
                          description: "Test Description",
                          inPorts: {
                              input: {
                                  datatype: 'string',
                                  description: "a string port",
                                  required: true
                              }
                          }
                        }, 
                        wrapper)
           );

            // Send data to the input port and verify that the fRunUpdater function is called.
            // We use a promise here because this section is asynchronous
            return new Promise(function(done, fail) { 

                test.onOutPortData(node, 'output', done);
                test.onOutPortData(node, 'error', fail);
                test.sendData(node, 'input', inData);

            }).then(function(done) { 
               // Success - verify we got what we expect
               done.vnid.should.equal(''); 
               done.data.should.equal(executedFRunUpdater); 

            }, function(fail) { 
               // Failure - something is not right
               assert.isNotOk(fail);
            });
        });

        it("should handle two input/output state changes", function() {

            var inData1 = "A bit of input data";
            var inData2 = "Another bit of input data";

            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function(vni) { 

                // update state
                vni.outputState({data: vni.inputStates('input').data, lm: createLm()});
            }

            // Create a pipeline component and get the node instance for it
            var wrapper = { fRunUpdater: fRunUpdater };
            var node = test.createComponent(
                factory({
                          description: "Test Description",
                          inPorts: {
                              input: {
                                  datatype: 'string',
                                  description: "a string port",
                                  required: true
                              }
                          }
                        }, 
                        wrapper)
           );

            // Send data to the input port and verify that the fRunUpdater function is called.
            // We use a promise here because this section is asynchronous
            return new Promise(function(done, fail) { 

                test.onOutPortData(node, 'output', done);
                test.onOutPortData(node, 'error', fail);
                test.sendData(node, 'input', inData1);

            }).then(function(done) { 
               // Success - verify we got what we expect
               done.vnid.should.equal(''); 
               done.data.should.equal(inData1); 

               return new Promise(function(done2, fail2) { 
                  test.onOutPortData(node, 'output', done2);
                  test.onOutPortData(node, 'error', fail2);
                  test.sendData(node, 'input', inData2);
               }).then(function(done2) { 

                  done2.vnid.should.equal(''); 
                  done2.data.should.equal(inData2); 

               }, function(fail2) { 
                   assert.isNotOk(fail2);
               });

            }, function(fail) { 
               assert.isNotOk(fail);
            });
        });

        it("should handle two updater set error state changes", function() {

            var inData1 = "A bit of input data";
            var inData2 = "Another bit of input data";
            var count = 0;
            var errors = [ "Error 1", "Error 2" ];
            var outData = [ "Data 1", "Data 2" ];

            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function(vni) { 

                // update error state
                vni.errorState({data: errors[count], lm: createLm()});

                vni.outputState({data: outData[count++], lm: createLm()});
            }

            // Create a pipeline component and get the node instance for it
            var wrapper = { fRunUpdater: fRunUpdater };
            var node = test.createComponent(
                factory({
                          description: "Test Description",
                          inPorts: {
                              input: {
                                  datatype: 'string',
                                  description: "a string port",
                                  required: true
                              }
                          }
                        }, 
                        wrapper)
           );

            var sendDataAndVerify = function(node, count) {

                return new Promise(function(done, fail) { 

                    test.onOutPortData(node, 'output', done);
                    test.onOutPortData(node, 'error', fail);
                    test.sendData(node, 'input', inData1);
    
                }).then(function(done) { 

                   // Completed - verify we have the data and error state is set.
                   done.vnid.should.equal(''); 
                   done.data.should.equal(outData[count]); 
                   done.error.should.be.true;

                   // just execute this twice (count = 0,1)
                   if (count < 1) { 
                       return sendDataAndVerify(node, ++count);
                   }

                 }, function(fail) {
                   console.log('fail!');
                   assert.isNotOk(fail);
                });
            };

            return sendDataAndVerify(node, 0);
        });

        it("should handle two updater failures", function() {

            var inData = ["A bit of input data",
                          "Another bit of input data",
                          "A last bit of input data"];
            var updaterErr = "Updater failure";

            var count = 0;
 
            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function(vni) { 
                if (count < 2) { 
                    count++;
                    throw Error(updaterErr);
                }
            }

            // Create a pipeline component and get the node instance for it
            var wrapper = { fRunUpdater: fRunUpdater };
            var node = test.createComponent(
                factory({
                          description: "Test Description",
                          inPorts: {
                              input: {
                                  datatype: 'string',
                                  description: "a string port",
                                  required: true
                              }
                          }
                        }, 
                        wrapper)
           );

            var sendDataAndVerify = function(node, count) {
                // Send data to the input port and verify that the fRunUpdater function is called.
                // We use a promise here because this section is asynchronous
                return new Promise(function(done, fail) {

                    sinon.stub(logger, 'error');
                    test.onOutPortData(node, 'error', fail);
                    test.sendData(node, 'input', inData[0]);

                }).then(function(done) {
                   // Should not succeed
                   logger.error.restore();
                   assert.isNotOk(done);

                }, function(fail) {
                   fail.vnid.should.equal('');
                   fail.data.toString().should.equal('Error: '+ updaterErr);

                   if (count < 1) { 
                       logger.error.restore();
                       return sendDataAndVerify(node, ++count);
                   } else {
                       logger.error.restore();
                   }
 
                });

            }

            return sendDataAndVerify(node, 0);
        });

        it("should fail gracefully when fRunUpdater throws an exception.", function() {

            var inData = "A bit of input data";
            var executedFRunUpdater = "fRunUpdater failed!!!";

            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function(vni) { 
                throw new Error(executedFRunUpdater);
            }

            // Create a pipeline component and get the node instance for it
            var wrapper = { fRunUpdater: fRunUpdater };
            var node = test.createComponent(
                factory({
                          description: "Test Description",
                          inPorts: {
                              input: {
                                  datatype: 'string',
                                  description: "a string port",
                                  required: true
                              }
                          }
                        }, 
                        wrapper)
           );

            // Send data to the input port and verify that the fRunUpdater function is called.
            // We use a promise here because this section is asynchronous
            return new Promise(function(done) { 
    
                test.onOutPortData(node, 'output', done);
                sinon.stub(logger, 'error');
                sinon.stub(console, 'error');
                test.sendData(node, 'input', inData);

            }).then(function(done) { 
               // Should have sent an output state with error flag sent
               console.error.restore();
               logger.error.restore();
               done.should.be.an('object'); 
               done.should.have.all.keys('vnid', 'data', 'error', 'stale', 'lm', 'groupLm', 'componentName');
               done.error.should.be.true;
               expect(done.stale).to.be.undefined;
               expect(done.groupLm).to.be.undefined;
               done.componentName.should.equal('');
            });
        });

        it("should send error state when fRunUpdater fails.", function() {

            var inData = "A bit of input data";
            var executedFRunUpdater = "fRunUpdater failed!!!";

            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function(vni) { 
                throw new Error(executedFRunUpdater);
            }

            // Create a pipeline component and get the node instance for it
            var wrapper = { fRunUpdater: fRunUpdater };
            var node = test.createComponent(
                factory({
                          description: "Test Description",
                          inPorts: {
                              input: {
                                  datatype: 'string',
                                  description: "a string port",
                                  required: true
                              }
                          }
                        }, 
                        wrapper)
           );

            // Send data to the input port and verify that the fRunUpdater function is called.
            // We use a promise here because this section is asynchronous
            return new Promise(function(done, fail) { 
    
                test.onOutPortData(node, 'error', fail);

                sinon.stub(logger, 'error');
                test.sendData(node, 'input', inData);

            }).then(function(done) { 
               logger.error.restore();
               assert.fail('This test hould not be listening for output state');
      
            }, function(fail) { 
               // Not currently executed since we get the output port data before the error data
               logger.error.restore();
               fail.should.be.an('object'); 
               fail.should.have.all.keys('vnid', 'data', 'error', 'stale', 'lm', 'groupLm', 'componentName');
               fail.data.toString().should.equal('Error: '+executedFRunUpdater);
               expect(fail.error).to.be.undefined;
               expect(fail.stale).to.be.undefined;
               expect(fail.groupLm).to.be.undefined;
               var lmComponents = fail.lm.match(/^LM(\d+)\.(\d+)$/);
               lmComponents.should.have.length(3);
            });
        });

        it("should catch exception when fRunUpdater post processing fails.", function() {

            var inData = "A bit of input data";
            var executedFRunUpdater = "fRunUpdater success!!!";
    
            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function(vni) { 
                // Make the output state undefined - this should cause the framework processing to fail
                vni.outputState(undefined);
            }

            // Create a pipeline component and get the node instance for it
            var wrapper = { fRunUpdater: fRunUpdater };
            var node = test.createComponent(
                factory({
                          description: "Test Description",
                          inPorts: {
                              input: {
                                  datatype: 'string',
                                  description: "a string port",
                                  required: true
                              }
                          }
                        }, 
                        wrapper)
           );

            return new Promise(function(done, fail) { 

                test.onOutPortData(node, 'output', fail);
                test.onOutPortData(node, 'error', fail);

                var logBuffer = '';
                sinon.stub(logger, 'error', function (message) {
                    logBuffer += message;
                }); 

                test.sendData(node, 'input', inData);
                setTimeout(function() { 
                                if (-1 < logBuffer.indexOf("unable to process fRunUpdater results!")) {
                                    done();
                                }
                            }, 
                            1000);

            }).then(function(done) { 
               // Should go through here after the timeout
               logger.error.restore();
            }, function(fail) { 
               logger.error.restore();
               throw Error(fail);
            });
        });


    });

    describe("functional noflo network behavior", function() {

        it("should manage multiple port node vni state, fRunUpdater invocation, & output state", function() {
            this.timeout(2750);
            var input1 = 'Uno';
            var input2 = 'Dos';
            var executedFRunUpdater = "Executed fRunUpdater API";

            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function(vni) { 
                // Verify this is vni context
                vni.should.have.all.keys(
                    'vnid', 'delete', 'inputStates', 'errorState', 'outputState', 'nodeInstance');
                
                test.verifyState(vni.inputStates('input1'), '', input1);
                test.verifyState(vni.inputStates('input2'), '', input2);

                // update state
                vni.outputState({data: executedFRunUpdater, lm: createLm()});
            }

            // Create a pipeline component and get the node instance for it
            var wrapper = { fRunUpdater: fRunUpdater };
              
            return test.createNetwork({ node1: 'core/Repeat', // input node to test node 3
                                        node2: 'core/Repeat', // input node to test node 3
                                        node3: { 
                                             getComponent: factory({ 
                                                 description: "Test Description",
                                                 inPorts: {
                                                     input1: {
                                                         datatype: 'string',
                                                         description: "a string port",
                                                         required: true
                                                     },
                                                     input2: {
                                                         datatype: 'string',
                                                         description: "a string port",
                                                         required: true
                                                     }
                                                 }
                                               }, 
                                               wrapper)
                                         }
            }).then(function(network) {
                return new Promise(function(done, fail) { 

                    // True noflo component - not facade
                    var node = network.processes.node3.component;

                    test.onOutPortData(node, 'output', done);
                    test.onOutPortData(node, 'error', fail);

                    network.graph.addEdge('node1', 'out', 'node3', 'input1');
                    network.graph.addEdge('node2', 'out', 'node3', 'input2');

                    network.graph.addInitial(input1, 'node1', 'in');
                    network.graph.addInitial(input2, 'node2', 'in');

                }).then(function(done) { 

                   // verify we got the output state we expect
                   done.vnid.should.equal(''); 
                   done.data.should.equal(executedFRunUpdater);
                });
            });
        });

        it("should invoke fRunUpdater without waiting for unattached port data", function() {

            this.timeout(3000);
            var requiredPortData = 'Required Port Data';
            var executedFRunUpdater = "Executed fRunUpdater API";

            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function(vni) { 

                vni.should.have.all.keys(
                    'vnid', 'delete', 'inputStates', 'errorState', 'outputState', 'nodeInstance');
                
                test.verifyState(vni.inputStates('reqport'), '', requiredPortData);

                // Verify we got no state on the optional port
                var optState = vni.inputStates('optport');
                expect(optState).to.be.undefined;

                // update state
                vni.outputState({data: executedFRunUpdater, lm: createLm()});
            }

            // Create a pipeline component and get the node instance for it
            var wrapper = { fRunUpdater: fRunUpdater };
            return test.createNetwork({ node1: 'core/Repeat', // input node to test node 3
                                        node2: { 
                                             getComponent: factory({ 
                                                 description: "Test Description",
                                                 inPorts: {
                                                     optport: {
                                                         datatype: 'string',
                                                         description: "an optional string port",
                                                         required: false
                                                     },
                                                     reqport: {
                                                         datatype: 'string',
                                                         description: "a required string port",
                                                         required: true
                                                     }
                                                 }
                                               }, 
                                               wrapper)
                                         }
            }).then(function(network) {
                return new Promise(function(done, fail) { 

                    // True noflo component - not facade
                    var node = network.processes.node2.component;

                    test.onOutPortData(node, 'output', done);
                    test.onOutPortData(node, 'error', fail);

                    // Add one edge between repeater component to required port
                    // Note that we will have no edge tothe optional port
                    network.graph.addEdge('node1', 'out', 'node2', 'reqport');

                    // Send data to the required port through the repeater node
                    // We'll send nothing to the optional port thru node1
                    network.graph.addInitial(requiredPortData, 'node1', 'in');
                }).then(function(done) { 

                   // verify we got the output state we expect
                   done.vnid.should.equal(''); 
                   done.data.should.equal(executedFRunUpdater);
                });
            });
        });

        it("should not invoke fRunUpdater with missing attached port data", function() {

            this.timeout(3000);
            var portData = 'Some Port Data';

            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function(vni) { 
               // Should not call fRunUpdater when data is missing 
               // from an attached port
               assert.isNotOk("fRunUpdater should not be called when missing attached port data!");
            }

            // Create a pipeline component and get the node instance for it
            var wrapper = { fRunUpdater: fRunUpdater };

            return test.createNetwork({ node1: 'core/Repeat', // input node to test node 3
                                         node2: 'core/Repeat', // input node to test node 3
                                         node3: { 
                                             getComponent: factory({ 
                                                 description: "Test Description",
                                                 inPorts: {
                                                     input1: {
                                                         datatype: 'string',
                                                         description: "a string port",
                                                         required: true
                                                     },
                                                     input2: {
                                                         datatype: 'string',
                                                         description: "a string port",
                                                         required: true
                                                     }
                                                 }
                                               },
                                               wrapper)
                                         }
            }).then(function(network) {
                return new Promise(function(done, fail) {

                    // True noflo component - not facade
                    var node = network.processes.node3.component;

                    // Fail if we get output or error:
                    test.onOutPortData(node, 'output', fail);
                    test.onOutPortData(node, 'error', fail);

                    // Attach both repeater nodes - one to each input port 
                    network.graph.addEdge('node1', 'out', 'node3', 'input1');
                    network.graph.addEdge('node2', 'out', 'node3', 'input2');

                    // send data to only one of the two attached ports
                    network.graph.addInitial(portData, 'node1', 'in');
                    // network.graph.addInitial(portData, 'node2', 'in');

                    // wait and verify we don't hit the fRunUpdater
                    setTimeout(function() { 
                                    done();
                                }, 
                                100);
                });
            });
        });

        it("should call fRunUpdater on addressable ports", function() {
            this.timeout(2750);
            var inputEdge1 = 'Eins';
            var inputEdge2 = 'Zwei';
            var executedFRunUpdater = "Executed fRunUpdater API";

            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function(vni) { 

                // Verify this is vni context
                vni.should.have.all.keys(
                    'vnid', 'delete', 'inputStates', 'errorState', 'outputState', 'nodeInstance');
                
                // Get the input states
                var states = vni.inputStates('input');

                // Verify we got both input states with correct values
                states.should.have.length(2);      
                test.verifyState(states[0], '', inputEdge1);
                test.verifyState(states[1], '', inputEdge2);

                // update state
                vni.outputState({data: executedFRunUpdater, lm: createLm()});
            }

            // Create a pipeline component and get the node instance for it
            var wrapper = { fRunUpdater: fRunUpdater };
            return test.createNetwork({ node1: 'core/Repeat', // input node to test node 3
                                         node2: 'core/Repeat', // input node to test node 3
                                         node3: { 
                                             getComponent: factory({ 
                                                 description: "Test Description",
                                                 inPorts: {
                                                     input: {
                                                         datatype: 'string',
                                                         description: "a string port",
                                                         addressable: true,
                                                         required: true
                                                     }
                                                 }
                                               }, 
                                               wrapper)
                                         }
            }).then(function(network) {
                return new Promise(function(done, fail) { 

                    // True noflo component - not facade
                    var node = network.processes.node3.component;

                    test.onOutPortData(node, 'output', done);
                    test.onOutPortData(node, 'error', fail);

                    // Add two edges feeding data to input port 
                    network.graph.addEdge('node1', 'out', 'node3', 'input');
                    network.graph.addEdge('node2', 'out', 'node3', 'input');

                    network.graph.addInitial(inputEdge1, 'node1', 'in');
                    network.graph.addInitial(inputEdge2, 'node2', 'in');

                }).then(function(done) { 

                   // Verify we got the output state we expect
                   done.vnid.should.equal(''); 
                   done.data.should.equal(executedFRunUpdater);
                });
            });
        });

        it("should be deterministic with options first", function() {
            this.timeout(5000);
            var payload = {vnid: '1', data: 'I'};
            return new Promise(function(done, fail){
                test.createNetwork({
                    node: factory({
                        inPorts: {
                            input: {},
                            options: {}
                        }
                    }, {
                        fRunUpdater: function(vni){
                            done(vni.inputStates('input'));
                        }
                    })
                }).then(function(network){
                    network.graph.addInitial('O', 'node', 'options');
                    network.graph.addInitial(payload, 'node', 'input');
                }).catch(fail);
            }).should.eventually.deep.equal(payload);
        });

        it("should be deterministic with options second", function() {
            this.timeout(5000);
            var payload = {vnid: '1', data: 'I'};
            return new Promise(function(done, fail){
                test.createNetwork({
                    node: factory({
                        inPorts: {
                            input: {},
                            options: {}
                        }
                    }, {
                        fRunUpdater: function(vni){
                            done(vni.inputStates('input'));
                        }
                    })
                }).then(function(network){
                    network.graph.addInitial(payload, 'node', 'input');
                    network.graph.addInitial('O', 'node', 'options');
                }).catch(fail);
            }).should.eventually.deep.equal(payload);
        });

        // Propagates a metadata property "id" from an up stream node to down stream node.
        it("should propagate input metadata downstream", function() {
            var testId = "test identifier";
            var testdata = "more data";
            return test.createNetwork({
                node1: {getComponent: factory({inPorts: {input: {}}, 
                                               outPorts: {output: {}}
                                             },
                                             {fRunUpdater: function(vni){ 
                                                  // put id metadata and value into the output state
                                                  vni.outputState({id: testId, data: "some data", lm: createLm()}); 
                                             }}
                )}, 
                node2: {getComponent: factory({inPorts: {input: {}},
                                               outPorts: {output: {}}
                                              },
                                              {fRunUpdater: function(vni){ 
                                                   // update data and timestamp, but don't tamper with the metadata
                                                   vni.outputState({data: testdata, lm:createLm()}); 
                                              }}
                )}
            }).then(function(network){

                 return new Promise(function(done, fail) {
                     var node1 = network.processes.node1.component;
                     var node2 = network.processes.node2.component;

                     network.graph.addEdge('node1', 'output', 'node2', 'input');

                     test.onOutPortData(node2, 'output', done);
                     test.onOutPortData(node2, 'error', fail);

                     network.graph.addInitial("init data", 'node1', 'input');
                 }).then(function(done) {
                     test.verifyState(done, '', testdata);
                     done.id.should.equal(testId);  // verify framework propagated the metadata id to the second node
                 });

            });
        });


        // sets and maintains the same metadata property "id" with same value despite multiple updater calls 
        // with different data
        it("should maintain same metadata value when received multiple times", function() {
            var testId = "test identifier";
            var testdata = "more data";
            return test.createNetwork({
                node1: {getComponent: factory({
                                               inPorts: {input: {}}, 
                                               outPorts: {output: {}}
                                              },
                                              {fRunUpdater: function(vni){ 
                                                  // set metadata id property with a test id
                                                  vni.outputState({id: testId, data: "some data", lm: createLm()}); 
                                              }}
                )}, 
                node2: {getComponent: factory({
                                               inPorts: {input: {}},
                                               outPorts: {output: {}}
                                              },
                                              {fRunUpdater: function(vni){ 
                                                   // update data but don't tamper with metadata id 
                                                   vni.outputState({data: testdata, lm:createLm()});
                                              }}
                                      )
               }
            }).then(function(network){

                 var node1 = network.processes.node1.component;
                 var node2 = network.processes.node2.component;

                 return new Promise(function(done, fail) {

                     network.graph.addEdge('node1', 'output', 'node2', 'input');

                     test.onOutPortData(node2, 'output', done);
                     test.onOutPortData(node2, 'error', fail);

                     network.graph.addInitial("init data", 'node1', 'input');
                 }).then(function(done) {
                     test.verifyState(done, '', testdata);
                     done.id.should.equal(testId);  // verify framework propagated the metadata id to the second node

                     return new Promise(function(done2) {
                         test.onOutPortData(node2, 'output', done2);
                         network.graph.addInitial("second data", 'node1', 'input');

                     }).then(function(done2) {
                         test.verifyState(done2, '', testdata);
                         done2.id.should.equal(testId); 
                     });
                 });
            });
        });

        it("should handle multiple metadata values for same key", function() {
            var testId = "test identifier";
            var count = 0;
            var testdata = "more data";
            return test.createNetwork({
                node1: {getComponent: factory({
                                               inPorts: {input: {}}, 
                                               outPorts: {output: {}}
                                              },
                                              {fRunUpdater: function(vni){ 
                                                   count++;
                                                   vni.outputState({id: testId + count, data: "some data", lm: createLm()}); 
                                              }}
                )}, 
                node2: {getComponent: factory({
                                               inPorts: {input: {}},
                                               outPorts: {output: {}}
                                              },
                                              {fRunUpdater: function(vni){ 
                                                   vni.outputState({data: testdata, lm:createLm()});
                                              }}
                                      )
               }
            }).then(function(network){

                 var node1 = network.processes.node1.component;
                 var node2 = network.processes.node2.component;

                 return new Promise(function(done, fail) {

                     network.graph.addEdge('node1', 'output', 'node2', 'input');

                     test.onOutPortData(node2, 'output', done);
                     test.onOutPortData(node2, 'error', fail);

                     network.graph.addInitial("init data", 'node1', 'input');

                 }).then(function(done) {
                     test.verifyState(done, '', testdata);
                     done.id.should.equal(testId+count);

                     return new Promise(function(done2) {
                         test.onOutPortData(node2, 'output', done2);

                         network.graph.addInitial("second data", 'node1', 'input');
                     }).then(function(done2) {
                         test.verifyState(done2, '', testdata);
                         done2.id.should.equal(testId+'2'); // verify we have an array of values

                         return new Promise(function(done3) {
                             test.onOutPortData(node2, 'output', done3);
                             network.graph.addInitial("third data", 'node1', 'input');

                         }).then(function(done3) {
                             test.verifyState(done3, '', testdata);
                             done3.id.should.deep.equal(testId+'3'); // verify the array grew
                         });

                     });
                 });

            });
        });

        it("should handle undefined metadata value updates", function() {
            var testId = "test identifier";
            var testdata = "more data";
            var count = 0;
            return test.createNetwork({
                node1: {getComponent: factory({
                                               inPorts: {input: {}}, 
                                               outPorts: {output: {}}
                                              },
                                              {fRunUpdater: function(vni) { 
                                                  count++;
                                                  if (count % 2 === 1) 
                                                      vni.outputState({id: testId, data: "some data", lm: createLm()}); 
                                                  else
                                                      vni.outputState({id: undefined, data: "some data", lm: createLm()}); 
                                              }}
                )}, 
                node2: {getComponent: factory({
                                               inPorts: {input: {}},
                                               outPorts: {output: {}}
                                              },
                                              {fRunUpdater: function(vni){ 
                                                   vni.outputState({data: testdata, lm:createLm()});
                                              }}
                                      )
               }
            }).then(function(network){

                 var node1 = network.processes.node1.component;
                 var node2 = network.processes.node2.component;

                 return new Promise(function(done, fail) {

                     network.graph.addEdge('node1', 'output', 'node2', 'input');

		     test.onOutPortData(node2, 'output', done);
		     test.onOutPortData(node2, 'error', fail);

                     network.graph.addInitial("init data", 'node1', 'input');
                 }).then(function(done) {
                     test.verifyState(done, '', testdata);
                     done.id.should.equal(testId); // Verify we got the single value we expect

                     return new Promise(function(done2) {
                         test.onOutPortData(node2, 'output', done2);
                         network.graph.addInitial("second data", 'node1', 'input');

                     }).then(function(done2) {
                         test.verifyState(done2, '', testdata);
                         expect(done2.id).to.be.undefined; // verify our metadata value was reset to undefined

                         return new Promise(function(done3) {
                             test.onOutPortData(node2, 'output', done3);
                             network.graph.addInitial("third data", 'node1', 'input');

                         }).then(function(done3) {
                             test.verifyState(done3, '', testdata);
                             done3.id.should.equal(testId);   // verify that we got the single value we expect again
                         });
                     });
                 });
            });

        });

        it("should NOT clear non-transient node VNI after sending output state downstream", function() {
            var nodeInstance;
            var testData = "Buongiorno!";
            return test.createNetwork({
                testNode: {getComponent: factory({
                                                   inPorts: {input: {}}, 
                                                   outPorts: {output: {}},
                                                   isTransient: false 
                                                 },
                                                 {fRunUpdater: function(vni,input) { 
                                                      nodeInstance = vni.nodeInstance;
                                                      vni.outputState({data: testData, 
                                                                       lm: createLm()}); 
                                                 }}
                )} 
            }).then(function(network){

                 var testNode = network.processes.testNode.component;

                 return new Promise(function(done, fail) {

		     test.onOutPortData(testNode, 'output', done);
		     test.onOutPortData(testNode, 'error', fail);

                     network.graph.addInitial("init data", 'testNode', 'input');
                 }).then(function(done) {
                     test.verifyState(done, '', testData);

                     // Verify VNI has been cleared
                     expect(nodeInstance).to.not.be.empty;
                     nodeInstance.vnis.should.be.an('object');
                     nodeInstance.vnis.should.not.be.empty;
                 });
            });
        });

        it("should clear transient node VNI after sending output state downstream", function() {
            var nodeInstance;
            var testData = "Ciao!";
            return test.createNetwork({
                testNode: {getComponent: factory({
                                                   inPorts: {input: {}}, 
                                                   outPorts: {output: {}},
                                                   isTransient: true
                                                 },
                                                 {fRunUpdater: function(vni,input) { 
                                                      nodeInstance = vni.nodeInstance;
                                                      vni.outputState({data: testData, 
                                                                       lm: createLm()}); 
                                                 }}
                )} 
            }).then(function(network){

                 var testNode = network.processes.testNode.component;

                 return new Promise(function(done, fail) {

		     test.onOutPortData(testNode, 'output', done);
		     test.onOutPortData(testNode, 'error', fail);

                     network.graph.addInitial("init data", 'testNode', 'input');
                 }).then(function(done) {
                     test.verifyState(done, '', testData);

                     // Verify VNI has been cleared
                     expect(nodeInstance).to.not.be.empty;
                     nodeInstance.vnis.should.be.an('object');
                     nodeInstance.vnis.should.be.empty;
                 });
            });
        });

        it("should clear transient node VNI after sending the output state without affecting downstream node state", function() {
            var nodeInstance;
            var testData = "Arrivederci!";
            return test.createNetwork({
                testNode: {getComponent: factory({
                                                   inPorts: {input: {}}, 
                                                   outPorts: {output: {}},
                                                   isTransient: true
                                                 },
                                                 {fRunUpdater: function(vni,input) { 
                                                      nodeInstance = vni.nodeInstance;
                                                      vni.outputState({data: testData, 
                                                                       lm: createLm()}); 
                                                 }}
                )},
                downstreamNode: 'rdf-components/vni-data-output' 
            }).then(function(network){

                 var testNode = network.processes.testNode.component;
                 var downstreamNode = network.processes.downstreamNode.component;

                 return new Promise(function(done, fail) {

                     network.graph.addEdge('testNode', 'output', 'downstreamNode', 'in');

		     test.onOutPortData(downstreamNode, 'out', done);

                     sinon.stub(console,'log');
                     network.graph.addInitial("init data", 'testNode', 'input');

                 }).then(function(done) {
                     console.log.restore();
                     done.should.equal(testData);

                     // Verify VNI has been cleared
                     expect(nodeInstance).to.not.be.empty;
                     nodeInstance.vnis.should.be.an('object');
                     nodeInstance.vnis.should.be.empty;
                 });
            });
        });

        it("should clear only the current VNI in a transient node with multiple VNIs", function() {
            var nodeInstance;
            var testData = "Addio!";
            return test.createNetwork({
                testNode: {getComponent: factory({
                                                   inPorts: {input: {}}, 
                                                   outPorts: {output: {}},
                                                   isTransient: true
                                                 },
                                                 {fRunUpdater: function(vni,input) { 
                                                      nodeInstance = vni.nodeInstance;
                                                      // create 5 VNIs in addition to our default '' vni
                                                      for (var i=1; i <= input; i++) {
                                                          nodeInstance.vni(i);
                                                      }
                                                      vni.outputState({data: testData, 
                                                                       lm: createLm()}); 
                                                 }}
                )}
            }).then(function(network){

                 var testNode = network.processes.testNode.component;

                 return new Promise(function(done, fail) {

		     test.onOutPortData(testNode, 'output', done);

                     network.graph.addInitial(5, 'testNode', 'input');
                 }).then(function(done) {
                     test.verifyState(done, '', testData);

                     // Verify default VNI has been cleared
                     expect(nodeInstance).to.not.be.empty;
                     nodeInstance.vnis.should.be.an('object');
                     var vnids = Object.keys(nodeInstance.vnis);
                     vnids.should.not.contain(''); // no default VNI
                     vnids.should.have.length(5); // we should still have 5 other VNIs that were created
                 });
            });
        });

        it("should not call the updater if input is in error state", function(done) {

            return test.createNetwork({testNode: jswrapper({updater: function(input) {
                                               assert.fail('Updater should not be called!');
                                      }})
            }).then(function(network){
 
                var testNode = network.processes.testNode.component;
                sinon.stub(logger, 'debug', function (message) {
                    if ( message === 'testNode is not ready for to run updater yet.') { 
                        logger.debug.restore();
                        done();
                    }
                }); 

                var badState = stateFactory('', 
                                            'tres mal', 
                                            createLm(),  // lm
                                            true);       // set error flag
                test.sendData(testNode, 'input', badState);
            });
        });

        it("should not change lm when output state changes to error state", function() {
    
            var goodJson = '{"One": "Thing1", "Two":"Thing2"}';
            var badJson = '{ Cat: In the Hat}';

            return test.createNetwork({
                parseJson: 'rdf-components/parse-json'
            }).then(function(network){

                var parseJson = network.processes.parseJson.component;

                return new Promise(function(first) {

                    // Listen for results while we send some good json to the network
                    test.onOutPortData(parseJson, 'output', first);

                    sinon.stub(console, 'error');
                    network.graph.addInitial(goodJson, 'parseJson', 'input');
                }).then(function(first) {

                    // Verify we got the expected good state
                    var parsedJson = JSON.parse(goodJson);
                    test.verifyState(first, '', parsedJson);

                    // Now send some bad json
                    return new Promise(function(second) {
                        test.onOutPortData(parseJson, 'output', second);
                        network.graph.addInitial(badJson, 'parseJson', 'input');

                    }).then(function(second) {
                        console.error.restore();

                        // Verify we have the original data with the error flag set to true
                        test.verifyState(second, '', parsedJson, true);

                        // Verify the timestamp is unchanged
                        second.lm.should.equal(first.lm);
                    });
                });
            });
 
        });
    });
});
