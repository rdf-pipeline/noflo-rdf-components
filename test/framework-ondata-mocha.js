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

var framework_ondata = require('../src/framework-ondata');
var factory = require('../src/pipeline-component-factory');
var test = require('./common-test');
var createLm = require('../src/create-lm');

describe("framework-ondata", function() {

    it( "should exist as a function", function() {
      framework_ondata.should.exist;
      framework_ondata.should.be.a('function');
    });

    describe("#ondata", function() {

        it( "should throw error if no wrapper fRunUpdater configured", function() {

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
            return new Promise( function(done, fail) {
                // Send some data to the input port
                test.onOutPortData(node, 'output', done);
                test.onOutPortData(node, 'error', fail);
                test.sendData(node, 'input', inData);
            }).should.be.rejectedWith('No wrapper fRunUpdater function found!  Cannot run updater.');
        });

        it( "should manage single port node vni state, fRunUpdater invocation, & output state", function() {

            var inData = "A bit of input data";
            var executedFRunUpdater = "Executed fRunUpdater API";

            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function( vni ) { 
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
                        wrapper )
            );

            // Send data to the input port and verify that the fRunUpdater function is called.
            // We use a promise here because this section is asynchronous
            return new Promise( function(done, fail) { 

                test.onOutPortData(node, 'output', done);
                test.onOutPortData(node, 'error', fail);
                test.sendData(node, 'input', inData);

            }).then( function( done ) { 
               // Success - verify we got what we expect
               done.vnid.should.equal( '' ); 
               done.data.should.equal( executedFRunUpdater ); 

            }, function( fail ) { 
               // Failure - something is not right
               assert.isNotOk( fail );
            });
        });

        it( "should handle two input/output state changes", function() {

            var inData1 = "A bit of input data";
            var inData2 = "Another bit of input data";

            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function( vni ) { 

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
                        wrapper )
            );

            // Send data to the input port and verify that the fRunUpdater function is called.
            // We use a promise here because this section is asynchronous
            return new Promise( function(done, fail) { 

                test.onOutPortData(node, 'output', done);
                test.onOutPortData(node, 'error', fail);
                test.sendData(node, 'input', inData1);

            }).then( function( done ) { 
               // Success - verify we got what we expect
               done.vnid.should.equal( '' ); 
               done.data.should.equal( inData1 ); 

               return new Promise( function(done2, fail2) { 
                  test.onOutPortData(node, 'output', done2);
                  test.onOutPortData(node, 'error', fail2);
                  test.sendData(node, 'input', inData2);
               }).then( function( done2 ) { 

                  done2.vnid.should.equal( '' ); 
                  done2.data.should.equal( inData2 ); 

               }, function( fail2 ) { 
                   assert.isNotOk( fail2 );
               });

            }, function( fail ) { 
               assert.isNotOk( fail );
            });
        });

        it( "should handle two updater set error state changes", function() {

            var inData1 = "A bit of input data";
            var inData2 = "Another bit of input data";
            var count = 0;
            var errors = [ "Error 1", "Error 2" ];
            var outData = [ "Data 1", "Data 2" ];

            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function( vni ) { 

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
                        wrapper )
            );

            var sendDataAndVerify = function( node, count ) {

                return new Promise( function(done, fail) { 

                    test.onOutPortData(node, 'output', done);
                    test.onOutPortData(node, 'error', fail);
                    test.sendData(node, 'input', inData1);
    
                }).then( function( done ) { 

                   // Completed - verify we have the data and error state is set.
                   done.vnid.should.equal( '' ); 
                   done.data.should.equal( outData[count] ); 
                   done.error.should.be.true;

                   // just execute this twice (count = 0,1)
                   if ( count < 1 ) { 
                       return sendDataAndVerify( node, ++count );
                   }

                 }, function( fail ) {
                   console.log('fail!');
                   assert.isNotOk( fail );
                });
            };

            return sendDataAndVerify( node, 0 );
        });

        it( "should handle two updater failures", function() {

            var inData = ["A bit of input data",
                          "Another bit of input data",
                          "A last bit of input data"];
            var updaterErr = "Updater failure";

            var count = 0;
 
            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function( vni ) { 
                if ( count < 2 ) { 
                    count++;
                    throw Error( updaterErr );
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
                        wrapper )
            );

            var sendDataAndVerify = function( node, count ) {
                // Send data to the input port and verify that the fRunUpdater function is called.
                // We use a promise here because this section is asynchronous
                return new Promise( function(done, fail) {

                    test.onOutPortData(node, 'error', fail);
                    test.sendData(node, 'input', inData[0]);

                }).then( function( done ) {
                   // Should not succeed
                   assert.isNotOk( done );

                }, function( fail ) {
                   fail.vnid.should.equal( '' );
                   fail.data.toString().should.equal( 'Error: '+ updaterErr );

                   if ( count < 1 ) { 
                       return sendDataAndVerify( node, ++count );
                   }
                });

            }

            return sendDataAndVerify( node, 0 );
        });

        it( "should manage multiple port node vni state, fRunUpdater invocation, & output state", function() {

            var input1 = 'Uno';
            var input2 = 'Dos';
            var executedFRunUpdater = "Executed fRunUpdater API";

            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function( vni ) { 
                // Verify this is vni context
                vni.should.have.all.keys( 
                    'vnid', 'delete', 'inputStates', 'errorState', 'outputState', 'nodeInstance');
                
                test.verifyState( vni.inputStates( 'input1' ), '', input1 );
                test.verifyState( vni.inputStates( 'input2' ), '', input2 );

                // update state
                vni.outputState({data: executedFRunUpdater, lm: createLm()});
            }

            // Create a pipeline component and get the node instance for it
            var wrapper = { fRunUpdater: fRunUpdater };
              
            return test.createNetwork( { node1: 'core/Repeat', // input node to test node 3
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
                                               wrapper )
                                         }
            }).then( function( network ) {
                return new Promise( function(done, fail) { 

                    // True noflo component - not facade
                    var node = network.processes.node3.component;

                    test.onOutPortData(node, 'output', done);
                    test.onOutPortData(node, 'error', fail);

                    network.graph.addEdge( 'node1', 'out', 'node3', 'input1' );
                    network.graph.addEdge( 'node2', 'out', 'node3', 'input2' );

                    network.graph.addInitial( input1, 'node1', 'in' );
                    network.graph.addInitial( input2, 'node2', 'in' );

                }).then( function( done ) { 

                   // verify we got the output state we expect
                   done.vnid.should.equal( '' ); 
                   done.data.should.equal( executedFRunUpdater );
                });
            });
        });

        it( "should invoke fRunUpdater without waiting for unattached port data", function() {

            var requiredPortData = 'Required Port Data';
            var executedFRunUpdater = "Executed fRunUpdater API";

            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function( vni ) { 

                vni.should.have.all.keys( 
                    'vnid', 'delete', 'inputStates', 'errorState', 'outputState', 'nodeInstance');
                
                test.verifyState( vni.inputStates( 'reqport' ), '', requiredPortData );

                // Verify we got no state on the optional port
                var optState = vni.inputStates( 'optport' );
                expect( optState ).to.be.undefined;

                // update state
                vni.outputState({data: executedFRunUpdater, lm: createLm()});
            }

            // Create a pipeline component and get the node instance for it
            var wrapper = { fRunUpdater: fRunUpdater };
            return test.createNetwork( { node1: 'core/Repeat', // input node to test node 3
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
                                               wrapper )
                                         }
            }).then( function( network ) {
                return new Promise( function(done, fail) { 

                    // True noflo component - not facade
                    var node = network.processes.node2.component;

                    test.onOutPortData(node, 'output', done);
                    test.onOutPortData(node, 'error', fail);

                    // Add one edge between repeater component to required port
                    // Note that we will have no edge tothe optional port
                    network.graph.addEdge( 'node1', 'out', 'node2', 'reqport' );

                    // Send data to the required port through the repeater node
                    // We'll send nothing to the optional port thru node1
                    network.graph.addInitial( requiredPortData, 'node1', 'in' );
                }).then( function( done ) { 

                   // verify we got the output state we expect
                   done.vnid.should.equal( '' ); 
                   done.data.should.equal( executedFRunUpdater );
                });
            });
        });

        it( "should not invoke fRunUpdater with missing attached port data", function() {

            var portData = 'Some Port Data';

            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function( vni ) { 
               // Should not call fRunUpdater when data is missing 
               // from an attached port
               assert.isNotOk( "fRunUpdater should not be called when missing attached port data!" );
            }

            // Create a pipeline component and get the node instance for it
            var wrapper = { fRunUpdater: fRunUpdater };

            return test.createNetwork( { node1: 'core/Repeat', // input node to test node 3
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
                                               wrapper )
                                         }
            }).then( function( network ) {
                return new Promise( function(done, fail) {

                    // True noflo component - not facade
                    var node = network.processes.node3.component;

                    // Fail if we get output or error:
                    test.onOutPortData(node, 'output', fail);
                    test.onOutPortData(node, 'error', fail);

                    // Attach both repeater nodes - one to each input port 
                    network.graph.addEdge( 'node1', 'out', 'node3', 'input1' );
                    network.graph.addEdge( 'node2', 'out', 'node3', 'input2' );

                    // send data to only one of the two attached ports
                    network.graph.addInitial( portData, 'node1', 'in' );
                    // network.graph.addInitial( portData, 'node2', 'in' );

                    // wait and verify we don't hit the fRunUpdater
                    setTimeout( function() { 
                                    done();
                                }, 
                                100);
                });
            });
        });

        it("should call fRunUpdater on addressable ports", function() {

            var inputEdge1 = 'Eins';
            var inputEdge2 = 'Zwei';
            var executedFRunUpdater = "Executed fRunUpdater API";

            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function( vni ) { 

                // Verify this is vni context
                vni.should.have.all.keys( 
                    'vnid', 'delete', 'inputStates', 'errorState', 'outputState', 'nodeInstance');
                
                // Get the input states
                var states = vni.inputStates( 'input' );

                // Verify we got both input states with correct values
                states.should.have.length(2);      
                test.verifyState( states[0], '', inputEdge1 );
                test.verifyState( states[1], '', inputEdge2 );

                // update state
                vni.outputState({data: executedFRunUpdater, lm: createLm()});
            }

            // Create a pipeline component and get the node instance for it
            var wrapper = { fRunUpdater: fRunUpdater };
            return test.createNetwork( { node1: 'core/Repeat', // input node to test node 3
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
                                               wrapper )
                                         }
            }).then( function( network ) {
                return new Promise( function(done, fail) { 

                    // True noflo component - not facade
                    var node = network.processes.node3.component;

                    test.onOutPortData(node, 'output', done);
                    test.onOutPortData(node, 'error', fail);

                    // Add two edges feeding data to input port 
                    network.graph.addEdge( 'node1', 'out', 'node3', 'input' );
                    network.graph.addEdge( 'node2', 'out', 'node3', 'input' );

                    network.graph.addInitial( inputEdge1, 'node1', 'in' );
                    network.graph.addInitial( inputEdge2, 'node2', 'in' );

                }).then( function( done ) { 

                   // Verify we got the output state we expect
                   done.vnid.should.equal( '' ); 
                   done.data.should.equal( executedFRunUpdater );
                });
            });
        });

        it( "should fail gracefully when fRunUpdater throws an exception.", function() {

            var inData = "A bit of input data";
            var executedFRunUpdater = "fRunUpdater failed!!!";

            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function( vni ) { 
                throw new Error( executedFRunUpdater );
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
                        wrapper )
            );

            var logBuffer = '';
            // Hide expected console error message from test output
            sinon.stub( console, 'error', function (message) {
                 logBuffer += message;
            }); 

            // Send data to the input port and verify that the fRunUpdater function is called.
            // We use a promise here because this section is asynchronous
            return new Promise( function(done, fail) { 
    
                test.onOutPortData(node, 'output', done);
                test.onOutPortData(node, 'error', fail);

                test.sendData(node, 'input', inData);

            }).then( function( done ) { 
               // Should have sent an output state with error flag sent
               console.error.restore();
               done.should.be.an('object'); 
               done.should.have.all.keys('vnid', 'data', 'error', 'stale', 'lm' );
               done.error.should.be.true;
               expect( done.stale).to.be.undefined;

            }, function( fail ) { 
               // Not currently executed since we get the output port data before the error data
               console.error.restore();
               fail.should.be.an('object'); 
               fail.should.have.all.keys('vnid', 'data', 'error', 'stale', 'lm' );
               fail.data.toString().should.equal('Error: '+executedFRunUpdater);
            });
        });

        it( "should catch exception when fRunUpdater post processing fails.", function() {

            var inData = "A bit of input data";
            var executedFRunUpdater = "fRunUpdater success!!!";
    
            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function( vni ) { 
                // Make the output state undefined - this should cause the framework processing to fail
                vni.outputState( undefined );
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
                        wrapper )
            );

            var logBuffer = '';
            // Hide expected console error message from test output
            sinon.stub( console, 'error', function (message) {
                logBuffer += message;
            }); 

            return new Promise( function(done, fail) { 

                test.onOutPortData(node, 'output', done);
                test.onOutPortData(node, 'error', fail);

                test.sendData(node, 'input', inData);
                setTimeout( function() { 
                                done() 
                            }, 
                            1000);

            }).then( function( done ) { 
               // Should go through here after the timeout
               console.error.restore();
               logBuffer.startsWith('framework-ondata unable to process fRunUpdater results!').should.be.true;

            }, function( fail ) { 
               // Should not go through here right now 
               console.error.restore();
               assert.isNotOk( fail );
            });
        });

    });
});
