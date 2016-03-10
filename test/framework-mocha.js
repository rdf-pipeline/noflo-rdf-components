/**
 * File: framework-mocha.js
 * Unit tests for the framework APIs defined in src/framework.js
 */

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();
chai.use(chaiAsPromised);

var noflo = require('noflo');

var framework = require('../src/framework');
var test = require('./common-test');

describe("frameworks", function() {

    it("should exist as an object", function() {
      framework.should.exist;
      framework.should.be.a('object');
    });

    it("should create an RDF pipeline factory from the component definition", function() {

        var factory = framework.componentFactory({
            name: "Test Component",
            description: "Test Description",
            inPorts: {
                input1: {
                    datatype: 'string',
                    description: "a string port",
                    required: true
                },
                input2: {
                    datatype: 'object',
                    description: "an object port"
                }
            }
        });

        factory.should.exist;
        factory.should.be.a('function');
    });

    it( "should create a factory that instantiates to an RDF Pipeline node instance", function() {

        var node = test.createComponent( framework.componentFactory({
            description: "Test Description",
            inPorts: {
                input1: {
                    datatype: 'string',
                    description: "a string port",
                    required: true
                }
            }
        }));

        // Verify we got a basic node 
        node.should.exist;
        node.should.be.an('object');
        node.should.include.keys('nodeName', 'componentName', 'inPorts', 'outPorts', 
                                  'vnis', 'deleteAllVnis', 'deleteVni', 'vni' );

        // Verify we got the ports we expect to have
        Object.keys( node.inPorts ).should.have.length(1);
        node.inPorts.should.have.all.keys( 'input1' );
        Object.keys( node.outPorts ).should.have.length(2);
        node.outPorts.should.have.all.keys( 'output', 'error' );
    });

    it( "should support creation of node instances with custom output ports", function() {

        var node = test.createComponent( framework.componentFactory({
            description: "Test Description",
            inPorts: {
                input1: {
                    datatype: 'string',
                    description: "a string port",
                    required: true
                },
                input2: {
                    datatype: 'object',
                    description: "an object port"
                }
            },
            outPorts: {
                // Define a custom output port
                my_output: {
                    datatype: 'string',
                    description: "a string port",
                }
            }
        }));

        // Verify we got a basic node 
        node.should.exist;
        node.should.be.an('object');
        node.should.include.keys('nodeName', 'componentName', 'inPorts', 'outPorts', 
                                  'vnis', 'deleteAllVnis', 'deleteVni', 'vni' );

        // Verify we got the ports we expect to have
        Object.keys( node.inPorts ).should.have.length(2);
        node.inPorts.should.have.all.keys( 'input1', 'input2' );
        Object.keys( node.outPorts ).should.have.length(3);
        node.outPorts.should.have.all.keys( 'my_output', 'output', 'error' );
    });

    describe("#ondata", function() {

        it( "should manage single port node vni state, fRunUpdater invocation, & output state", function() {

            var inData = "A bit of input data";
            var executedFRunUpdater = "Executed fRunUpdater API";

            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function( inputStates ) { 
                return executedFRunUpdater;
            }

            // Create a noflo component and get the node instance for it
            var node = test.createComponent( framework.componentFactory({
                description: "Test Description",
                inPorts: {
                    input1: {
                        datatype: 'string',
                        description: "a string port",
                        required: true
                    }
                }
            }, fRunUpdater));

            // Send data to the input port and verify that the fRunUpdater function is called.
            // We use a promise here because this section is asynchronous
            return new Promise( function(done, fail) { 
                test.onOutPortData(node, 'output', done);
                test.onOutPortData(node, 'error', fail);
                test.sendData(node, 'input1', inData);
            }).then( function( done ) { 
               done.vnid.should.equal( '' ); 
               done.data.should.equal( executedFRunUpdater ); 
            }, function( fail ) { 
               assert.isNotOk( fail );
            });
        });

        it( "should manage multiple port node vni state, fRunUpdater invocation, & output state", function() {

            var input1 = 'Uno';
            var input2 = 'Dos';
            var executedFRunUpdater = "Executed fRunUpdater API";

            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function( inputStates ) { 

                // Verify we got state on both of our required ports
                inputStates.should.exist;
                Object.keys( inputStates ).should.have.length(2);

                inputStates.input1.should.be.an('object');
                inputStates.input1.vnid.should.equal('');
                inputStates.input1.data.should.equal(input1);

                inputStates.input2.should.be.an('object');
                inputStates.input2.vnid.should.equal('');
                inputStates.input2.data.should.equal(input2);

                return executedFRunUpdater;
            }

            // Create a noflo component and get the node instance for it
            var node = test.createComponent( framework.componentFactory({
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
            }, fRunUpdater));

            node.vnis.should.be.an( 'object' );
            Object.keys( node.vnis ).should.have.length(0);

            // Send data to the input port and verify that the fRunUpdater function is called.
            // We use a promise here because this section is asynchronous
            var socket1;
            var socket2;
            return new Promise( function(done, fail) { 

                test.onOutPortData(node, 'output', done);
                test.onOutPortData(node, 'error', fail);

                // Send data to both input ports being careful NOT to detach
                // Framework needs the socket attachment to know how many input 
                // edges there are
                var socket1 = noflo.internalSocket.createSocket();
                node._component_under_test.inPorts['input1'].attach(socket1);
                socket1.send(input1);
                socket1.disconnect();

                var socket2 = noflo.internalSocket.createSocket();
                node._component_under_test.inPorts['input2'].attach(socket2);
                socket2.send(input2);
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

        it( "should invoke fRunUpdater without waiting for optional port data", function() {

            var requiredPortData = 'Required Port Data';
            var executedFRunUpdater = "Executed fRunUpdater API";

            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function( inputStates ) { 

                inputStates.should.be.an('object');
                Object.keys( inputStates ).should.have.length(2);

                // Verify we got data on the required port
                inputStates.reqport.should.be.an('object');
                inputStates.reqport.vnid.should.equal('');
                inputStates.reqport.data.should.equal( requiredPortData );

                // Verify we got no state on the optional port
                expect( inputStates.optport ).to.be.undefined;

                return executedFRunUpdater;
            }

            // Create a noflo component and get the node instance for it
            var node = test.createComponent( framework.componentFactory({
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
            }, fRunUpdater));

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

        it( "should not invoke fRunUpdater with missing required data", function(done) {

            var optionalPortData = 'Optional Port Data';
            var executedFRunUpdater = "Executed fRunUpdater API";

            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function( inputStates ) { 
               // Should not call fRunUpdater when only optional data has been sent
               // and required port data is still missing
               assert.isNotOk( fail );
            }

            // Create a noflo component and get the node instance for it
            var node = test.createComponent( framework.componentFactory({
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
            }, fRunUpdater));

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
            var socket = noflo.internalSocket.createSocket();
            node._component_under_test.inPorts['optport'].attach(socket);
            socket.send( optionalPortData );
            socket.disconnect();

            // wait and verify we don't hit the fRunUpdater
            setTimeout(done(), 1900);
        });

        it("should call fRunUpdater on addressable ports", function() {

            var inputEdge1 = 'Eins';
            var inputEdge2 = 'Zwei';
            var executedFRunUpdater = "Executed fRunUpdater API";

            // Define the fRunUpdater that framework should invoke
            var fRunUpdater = function( inputStates ) { 

                // Verify we got both input states
                inputStates.should.be.an('object');
                expect( inputStates.input ).should.exist;
                Object.keys( inputStates.input ).should.have.length(2);

                inputStates.input[0].vnid.should.equal('');
                inputStates.input[0].data.should.equal( inputEdge1 );

                inputStates.input[1].vnid.should.equal('');
                inputStates.input[1].data.should.equal( inputEdge2 );

                return executedFRunUpdater;
            }

            // Create a noflo component and get the node instance for it
            var node = test.createComponent( framework.componentFactory({
                description: "Test Description",
                inPorts: {
                    input: {
                        datatype: 'string',
                        description: "a string port",
                        addressable: true,
                        required: true
                    }
                }
            }, fRunUpdater));

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

    });
});

