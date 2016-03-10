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

    it("should exist as a function", function() {
      framework_ondata.should.exist;
      framework_ondata.should.be.a('function');
    });

    describe("#ondata", function() {

        it( "should throw error if no wrapper fRunUpdater configured", function() {

            var inData = "A bit of input data";

            // Create a noflo component and get the node instance for it
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

            // Send data to the input port and verify that the fRunUpdater function is called.
            // We use a promise here because this section is asynchronous
            return new Promise( function(done, fail) {
                test.onOutPortData(node, 'output', done);
                test.onOutPortData(node, 'error', fail);
                test.sendData(node, 'input', inData);
            }).should.be.rejectedWith('No wrapper fRunUpdater function found!  Cannot run updater.');
        });

        it( "should manage single port node vni state, fRunUpdater invocation, & output state", function() {

            var inData = "A bit of input data";
            var executedFRunUpdater = "Executed fRunUpdater API";

            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function() { 

                // update state
                var state = this.outputState();
                state.data = executedFRunUpdater;
                state.lm = createLm();
                this.outputState( state );
            }

            // Create a noflo component and get the node instance for it
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

        it( "should manage multiple port node vni state, fRunUpdater invocation, & output state", function() {

            var input1 = 'Uno';
            var input2 = 'Dos';
            var executedFRunUpdater = "Executed fRunUpdater API";

            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function() { 
                // Verify this is vni context
                this.should.have.all.keys( 
                    'delete', 'inputStates', 'errorState', 'outputState', 'node');
                
                test.verifyState( this.inputStates( 'input1' ), '', input1 );
                test.verifyState( this.inputStates( 'input2' ), '', input2 );

                // update state
                var state = this.outputState();
                state.data = executedFRunUpdater;
                state.lm = createLm();
                this.outputState( state );
            }

            // Create a noflo component and get the node instance for it
            var wrapper = { fRunUpdater: fRunUpdater };
            var node = test.createComponent( 
                factory({
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
            );

            node.vnis.should.be.an( 'object' );
            Object.keys( node.vnis ).should.have.length(0);

            // Send data to the input port and verify that the fRunUpdater function is called.
            // We use a promise here because this section is asynchronous
            var socket1;
            var socket2;
            return new Promise( function(done, fail) { 

                test.onOutPortData(node, 'output', done);
                test.onOutPortData(node, 'error', fail);

                // Attach both ports up front 
                var socket1 = noflo.internalSocket.createSocket();
                node._component_under_test.inPorts['input1'].attach(socket1);
                var socket2 = noflo.internalSocket.createSocket();
                node._component_under_test.inPorts['input2'].attach(socket2);

                socket1.send(input1);
                socket2.send(input2);

                socket1.disconnect();
                socket2.disconnect();

            }).then( function( done ) { 
               // Verify we got the output state we expect
               done.vnid.should.equal( '' ); 
               done.data.should.equal( executedFRunUpdater ); 

               // Cleanup 
               test.detachAllInputSockets( node );
            }, function( fail ) { 
               assert.isNotOk( fail );
            });
        });

        it( "should invoke fRunUpdater without waiting for unattached port data", function() {

            var requiredPortData = 'Required Port Data';
            var executedFRunUpdater = "Executed fRunUpdater API";

            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function() { 

                // Verify this is vni context
                this.should.have.all.keys( 
                    'delete', 'inputStates', 'errorState', 'outputState', 'node');
                
                test.verifyState( this.inputStates( 'reqport' ), '', requiredPortData );

                // Verify we got no state on the optional port
                var optState = this.inputStates( 'optport' );
                expect( optState ).to.be.undefined;

                // update state
                var state = this.outputState();
                state.data = executedFRunUpdater;
                state.lm = createLm();
                this.outputState( state );
            }

            // Create a noflo component and get the node instance for it
            var wrapper = { fRunUpdater: fRunUpdater };
            var node = test.createComponent( 
                factory({
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
            );

            node.vnis.should.be.an( 'object' );
            Object.keys( node.vnis ).should.have.length(0);

            // Send data to the input port and verify that the fRunUpdater function is called.
            // We use a promise here because this section is asynchronous
            var socket;
            return new Promise( function(done, fail) { 

                test.onOutPortData(node, 'output', done);
                test.onOutPortData(node, 'error', fail);

                // Send data to just the required port.  Be careful NOT to detach
                // Framework needs the socket attachment to know how many input 
                // edges there are.  Send nothing to the optional port.  The 
                // fRunUpdater should run even though optional port has nothing.
                var socket = noflo.internalSocket.createSocket();
                node._component_under_test.inPorts['reqport'].attach(socket);

                socket.send( requiredPortData );
                socket.disconnect();

            }).then( function( done ) { 

               // Verify we got the output state we expect
               done.vnid.should.equal( '' ); 
               done.data.should.equal( executedFRunUpdater ); 

               // Cleanup 
               test.detachAllInputSockets( node );
            }, function( fail ) { 
               assert.isNotOk( fail );
            });
        });

        it( "should not invoke fRunUpdater with missing attached port data", function(done) {

            var optionalPortData = 'Optional Port Data';

            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function() { 
               // Should not call fRunUpdater when only optional data has been sent
               // and required port data is still missing
               assert.isNotOk( "fRunUpdater should not be called when missing attached port data!" );
            }

            // Create a noflo component and get the node instance for it
            var wrapper = { fRunUpdater: fRunUpdater };
            var node = test.createComponent( 
                factory({
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
            );

            node.vnis.should.be.an( 'object' );
            Object.keys( node.vnis ).should.have.length(0);

            // Send data to the input port and verify that the fRunUpdater function is called.
            // We use a promise here because this section is asynchronous
            var socket;
            var fail = function() {
                assert.fail('should not send output data without required data');
            };
            test.onOutPortData(node, 'output', fail);
            test.onOutPortData(node, 'error', fail);

            // Send data to just the optional port.  Be careful NOT to detach
            // Framework needs the socket attachment to know how many input 
            // edges there are.  Send nothing to the required port.  The 
            // fRunUpdater should NOT run.

            var socket1 = noflo.internalSocket.createSocket();
            node._component_under_test.inPorts['reqport'].attach(socket1);

            var socket2 = noflo.internalSocket.createSocket();
            node._component_under_test.inPorts['optport'].attach(socket2);

            socket2.send( optionalPortData );

            // wait and verify we don't hit the fRunUpdater
            setTimeout( function() { 
                            socket1.disconnect();
                            socket2.disconnect();
                            done() 
                        }, 
                        1900);
        });

        it("should call fRunUpdater on addressable ports", function() {

            var inputEdge1 = 'Eins';
            var inputEdge2 = 'Zwei';
            var executedFRunUpdater = "Executed fRunUpdater API";

            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function() { 

                // Verify this is vni context
                this.should.have.all.keys( 
                    'delete', 'inputStates', 'errorState', 'outputState', 'node');
                
                // Get the input states
                var states = this.inputStates( 'input' );

                // Verify we got both input states with correct values
                states.should.have.length(2);      
                test.verifyState( states[0], '', inputEdge1 );
                test.verifyState( states[1], '', inputEdge2 );

                // update state
                var state = this.outputState();
                state.data = executedFRunUpdater;
                state.lm = createLm();
                this.outputState( state );
            }

            // Create a noflo component and get the node instance for it
            var wrapper = { fRunUpdater: fRunUpdater };
            var node = test.createComponent( 
                factory({
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
            );

            // Attach 2 sockets to the same port and send each some data
            return new Promise( function(done, fail) { 

                // Monitor output and error port to see resulting status
                test.onOutPortData(node, 'output', done);
                test.onOutPortData(node, 'error', fail);

                var socket1 = noflo.internalSocket.createSocket();
                node._component_under_test.inPorts['input'].attach( socket1 );

                var socket2 = noflo.internalSocket.createSocket();
                node._component_under_test.inPorts['input'].attach( socket2 );

                socket1.send( inputEdge1 );
                socket2.send( inputEdge2 );

            }).then( function( done ) { 

               // Verify we got the output state we expect
               done.vnid.should.equal( '' ); 
               done.data.should.equal( executedFRunUpdater ); 

               // Cleanup 
               test.detachAllInputSockets( node );
            }, function( fail ) { 
               assert.isNotOk( fail );
            });
        });


        it( "should fail gracefully when fRunUpdater throws an exception.", function() {

            var inData = "A bit of input data";
            var executedFRunUpdater = "fRunUpdater failed!!!";

            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function() { 
                throw new Error( executedFRunUpdater );
            }

            // Create a noflo component and get the node instance for it
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
               // Should NOT succeed here since fRunUpdater threw an exception
               assert.isNotOk( done );

            }, function( fail ) { 
               // Expect a clean failure here since fRunUpdater threw an exception
               fail.should.not.be.empty;
               fail.data.toString().should.equal('Error: '+executedFRunUpdater);
            });
        });

        it( "should catch exception when fRunUpdater post processing fails.", function() {

            var inData = "A bit of input data";
            var executedFRunUpdater = "fRunUpdater success!!!";
    
            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function() { 
                // update state
                this.outputState( undefined );
            }

            // Create a noflo component and get the node instance for it
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

                var socket = noflo.internalSocket.createSocket();
                node._component_under_test.inPorts['input'].attach(socket);

                socket.send( inData );

                setTimeout( function() { 
                                logBuffer.should.equal('framework-ondata unable to process fRunUpdater results!');
                                socket.disconnect();
                                console.error.restore();
                                done() 
                            }, 
                            1900);

            }).then( function( done ) { 
               // Should go through here after the timeout
               logBuffer.should.equal('framework-ondata unable to process fRunUpdater results!');

            }, function( fail ) { 
               // Should not go through here right now 
               console.error.restore();
               assert.isNotOk( fail );
            });
        });

    });
});
