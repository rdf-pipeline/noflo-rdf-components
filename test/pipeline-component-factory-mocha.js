/**
 * pipeline-component-factory-mocha.js
 *
 * This module tests the pipline component factory to verify that it creates a noflo component 
 * with the appropriate RDF pipeline extensions.  Specifically RDF pipeline components should
 * have the following node extensions: 
 *   - A vni facade 
 *   - A wrapper object to be used to hold a reference to the standard RDF framework 
 *     wrapper functions: fRunUpdater, fExists, and fDestroyState. More details on wrappers
 *     can be found here: https://github.com/rdf-pipeline/noflo-rdf-pipeline/wiki/Wrapper-API 
 * In addition, rdf pipeline nodes should register an ondata callback function on each input port
 * to be called whenever new data is received. 
 */

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var _ = require('underscore');

var pipelineCompFactory = require('../src/pipeline-component-factory.js');
var stateFactory = require('../src/create-state');
var test = require('./common-test');

describe('pipeline-component-factory', function() {

    it("should exist as an function", function() {
        pipelineCompFactory.should.exist;
        pipelineCompFactory.should.be.a('function');
    });

    it("should reject undefined node definition", function() {
        return Promise.resolve().then(pipelineCompFactory).should.be.rejected;
    });

    it("should create an RDF pipeline component factory producing a node with pipeline extensions", function() {

        // define a node
        var nodeDef = {
            description: "A component description",
            inPorts: {
               input: {
                   datatype: 'string',
                   description: "a port description",
               }
            }
        }

        // Get a pipeline factory and instantiate the component without passing in a wrapper parameter
        var node = 
            test.createComponent( 
                pipelineCompFactory( nodeDef )); 

        // Verify the node looks right at the highest level
        node.should.exist;
        node.should.be.an('object');
        node.should.include.keys('nodeName', 'componentName', 'inPorts', 'outPorts',
                                  'vnis', 'deleteAllVnis', 'deleteVni', 'vni', 
                                  'wrapper' );

        // Verify we got the ports we expect to have
        Object.keys( node.inPorts ).should.have.length(1);
        node.inPorts.should.have.all.keys( 'input' );
        Object.keys( node.outPorts ).should.have.length(2);
        node.outPorts.should.have.all.keys( 'output', 'error' );

        // Verify vni facade API is there
        node.deleteAllVnis.should.be.a('function');
        node.deleteVni.should.be.a('function');
        node.vni.should.be.a('function');
        node.vnis.should.be.an('object');
        node.vnis.should.be.empty;

        // Verify that the default empty wrapper object is there
        node.wrapper.should.exist;
        node.wrapper.should.be.an('object');
        node.wrapper.should.be.empty;  // since we did not give any wrapper functions in this test
    });

    describe('#vnis', function() {

        it("should create an RDF pipeline component that can create and manipulate vnis", function() {
 
            // define a node and an empty wrapper
            var nodeDef = {
                description: "A component description",
                inPorts: {
                   input: {
                       datatype: 'string',
                       description: "a port description",
                   }
                }
            }
            wrapper = {}; 

            var node = 
                test.createComponent( 
                    pipelineCompFactory( nodeDef , wrapper )); 

            node.should.be.an('object');
            node.should.be.an('object');
            node.should.include.keys('nodeName', 'componentName', 'inPorts', 'outPorts',
                                      'vnis', 'deleteAllVnis', 'deleteVni', 'vni', 
                                      'wrapper' );

            // Verify that the default empty wrapper object is there
            node.wrapper.should.exist;
            node.wrapper.should.be.an('object');
            node.wrapper.should.be.empty;  // since we did not give any wrapper functions in this test

            // Verify vni APIs are functioning when invoked from this component

            // Test vni input state set/get
            var socketIndex = undefined;
            var vnid = '';
            var testInput = 'Simple test input';
            var vni = node.vni( vnid );
            vni.inputStates( 'input', socketIndex, stateFactory( vnid, testInput ) );
            var inputState = vni.inputStates( 'input' );
            test.verifyState( inputState, vnid, testInput );

            // Test vni output state set/get
            var testOutput = 'Simple test output';
            vni.outputState( stateFactory( vnid, testOutput ) );
            var outState = vni.outputState();
            test.verifyState( outState, vnid, testOutput );

            // Test basic vni error state set/get 
            var testError = 'Simple test error';
            vni.errorState( stateFactory( vnid, testError ) );
            var errorState = vni.errorState();
            test.verifyState( errorState, vnid, testError );
        });
    });

    describe('#wrapper', function() {

        it("should create an RDF pipeline component with the specified wrapper functions", function() {

            var nodeDef = {
                description: "A component description",
                inPorts: {
                   input: {
                       datatype: 'string',
                       description: "a port description",
                   }
                }
            }

            // Set some flags that will will set to true when the wrapper functions run
            var executed = { 
                fRunUpdater: false, 
                fExists: false,
                fDestroyState: false 
            };
                    
            // Define the standard set of wrapper functions.
            // For more details, refer to https://github.com/rdf-pipeline/noflo-rdf-pipeline/wiki/Wrapper-API
            wrapper = { 
                fRunUpdater: function() {
                    executed.fRunUpdater = true;
                },
                fExists: function() { 
                    executed.fExists = true;
                },
                fDestroyState: function() { 
                    executed.fDestroyState = true;
                }
            };

            // Create the rdf pipeline component factory and instantiate it
            var node = 
                test.createComponent( 
                    pipelineCompFactory( nodeDef , wrapper )); 

            // Verify component node instance looks OK
            node.should.be.an('object');
            node.wrapper.should.exist;
            node.wrapper.should.be.an('object');

            // Verify the wrapper is there with all the expected functions defined above
            node.wrapper.should.have.all.keys( 'fRunUpdater', 'fExists', 'fDestroyState' );
            node.wrapper.fRunUpdater.should.be.a('function');
            node.wrapper.fExists.should.be.a('function');
            node.wrapper.fDestroyState.should.be.a('function'); 
 
            // invoke each function and verify it ran
            node.wrapper.fRunUpdater();
            executed.fRunUpdater.should.be.true;

            node.wrapper.fExists();
            executed.fExists.should.be.true;

            node.wrapper.fDestroyState();
            executed.fDestroyState.should.be.true;
        });
    });

    describe('#ondata', function() {

        it("should create an RDF pipeline component that invokes ondata when an input  port receives data", function() {

            // Now go ahead and fire some data to the input port and verify that ondata stub gets called
            return new Promise(function(done){
                var nodeDef = {
                    description: "A component description",
                    inPorts: {
                       input: {
                           datatype: 'string',
                           description: "a port description",
                       }
                    }
                }

                var wrapper = {};

                var expectedPayload = "aloha";
                var ondata = function( payload ) { 
                    payload.should.exist;
                    payload.should.equal( expectedPayload );
                    done();
                };

                var node = 
                    test.createComponent( 
                        pipelineCompFactory( nodeDef, wrapper, ondata )); 

                node.should.be.an('object');
                node.wrapper.should.exist;
                node.wrapper.should.be.an('object');
                node.profiler.should.exist;
                node.profiler.should.be.an('object');

                // Send some test data to the port 
                test.sendData(node, 'input', expectedPayload);
            });
        });
    });

});
