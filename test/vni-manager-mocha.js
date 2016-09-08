/**
 * File: vni-manager-mocha.js
 * Unit tests for the vni APIs defined in src/vni-manager.js
 */

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var componentFactory = require('../src/noflo-component-factory');
var pipelineFactory = require('../src/pipeline-component-factory');

var createState = require('../src/create-state');
var inputStates = require('../src/input-states');
var promiseOutput = require('../src/promise-output');

var test = require('./common-test');

var vniManager = require('../src/vni-manager');
var componentName = 'enchanté';

describe("vni-manager", function() {

    beforeEach(function() {
        node = test.createComponent(componentFactory({
            inPorts:{input:{
                ondata: promiseOutput(function(payload){
                    return payload + " world";
                })
            }},
            outPorts: promiseOutput.outPorts
          }, vniManager)
       );

    });

    afterEach(function() {
        // clean up
        node.deleteAllVnis();
    });

    it("should exist as a function", function() {
        vniManager.should.exist;
        vniManager.should.be.a('function');
    });

    it("should return a component facade", function() {
        node.should.exist;
        node.should.be.an('object');
        node.should.include.keys('nodeName', 'componentName', 'inPorts', 'outPorts',
                                   'deleteAllVnis', 'deleteVni', 'vni', 'vnis');
    });

    describe("#vnis", function() {
        it("should exist as an object in the node.instance", function() {
            node.vnis.should.exist;
            node.vnis.should.be.a('object');
            Object.keys(node.vnis).should.have.length(0);
        });

        it("should write to the vnis of the node, with no cross-node interference", function() {

            // Create two test nodes 
            var node1 = test.createComponent(componentFactory({
                inPorts:{input:{
                    ondata: promiseOutput(function(payload){
                        return payload + " world";
                    })
                }},
                outPorts: promiseOutput.outPorts
              }, vniManager)
           );

            var node2 = test.createComponent(componentFactory({
                inPorts:{input:{
                    ondata: promiseOutput(function(payload){
                        return payload + " world2";
                    })
                }},
                outPorts: promiseOutput.outPorts
              }, vniManager)
           );
 
            node1.should.not.equal(node2);
            node1.vnis.should.not.equal(node2.vnis);

            // Set a vni with vnid 1
            var testVni1 = node1.vni('1');

            // Verify that node1 now has a length of one with 
            // the vni that has vnid 1
            testVni1.should.be.an('object');
	    testVni1.vnid.should.exist;
            testVni1.vnid.should.equal('1');
	    testVni1.errorState.should.exist;
	    testVni1.inputStates.should.exist;
	    testVni1.outputState.should.exist;
            Object.keys(node1.vnis).should.have.length(1);
            node1.vnis.should.have.all.keys('1');
            
            // Verify that node2 has no vnis
            Object.keys(node2.vnis).should.have.length(0);

            // Set node 2 with a vni with vnid 2
            var testVni2 = node2.vni('2');
            testVni2.should.be.an('object');
            testVni2.vnid.should.exist;
            testVni2.vnid.should.equal('2');
            testVni2.errorState.should.exist;
            testVni2.inputStates.should.exist;
            testVni2.outputState.should.exist;

            // Verify that node1 is unchanged - still has 1 vni with vnid 1
            Object.keys(node1.vnis).should.have.length(1);
            node1.vnis.should.have.all.keys('1');

            // verify node2 now has one vni with vnid 2
            Object.keys(node2.vnis).should.have.length(1);
            node2.vnis.should.have.all.keys('2');
        });
    });

    describe("#vni", function() {

        it("should create and return a new default vni if no vnid is specified and no vni exists", function() {

            var testVni = node.vni();

            testVni.should.be.an('object');
           
            testVni.nodeInstance.should.exist;
            testVni.nodeInstance.should.be.an('object');
            node.should.include.keys('nodeName', 'componentName', 'inPorts', 'outPorts',
                                     'vnis', 'deleteAllVnis', 'deleteVni', 'vni');

            testVni.vnid.should.exist;
            testVni.vnid.should.equal('');

            testVni.inputStates.should.exist;
            testVni.inputStates.should.be.a('function');

            testVni.errorState.should.exist;
            testVni.errorState.should.be.a('function');
            var errorState = testVni.errorState();
            errorState.should.have.all.keys('vnid', 'data', 'lm', 'error', 'stale', 'groupLm', 'componentName');
            errorState.vnid.should.equal('');
            expect(errorState.data).to.be.undefined;
            expect(errorState.lm).to.be.undefined;
            expect(errorState.error).to.be.undefined;
            expect(errorState.stale).to.be.undefined;
            expect(errorState.groupLm).to.be.undefined;
            errorState.componentName.should.equal('');

            testVni.outputState.should.exist;
            testVni.outputState.should.be.a('function');
            var outputState = testVni.outputState();
            outputState.vnid.should.equal('');
            expect(outputState.data).to.be.undefined;
            expect(outputState.lm).to.be.undefined;
            outputState.componentName.should.equal('');

            expect(testVni.parentVni).to.be.undefined;
            expect(testVni.errorState.previousLms).to.be.undefined;
            expect(testVni.outputState.previousLms).to.be.undefined;
        });

    it("should create and return a new default vni if an empty vnid is specified and no vni exists", function() {
  
            var testVnid = '';
            var testVni = node.vni(testVnid);

            testVni.nodeInstance.should.exist;
            testVni.nodeInstance.should.be.an('object');
            node.should.include.keys('nodeName', 'componentName', 'inPorts', 'outPorts',
                                     'vnis', 'deleteAllVnis', 'deleteVni', 'vni');

            testVni.should.be.an('object');

            testVni.vnid.should.exist;
            testVni.vnid.should.equal('');

            testVni.inputStates.should.exist;
            testVni.inputStates.should.be.a('function');

            testVni.errorState.should.exist;
            testVni.errorState.should.be.a('function');

            testVni.outputState.should.exist;
            testVni.outputState.should.be.a('function');

            expect(testVni.parentVni).to.be.undefined;
            expect(testVni.errorState.previousLms).to.be.undefined;
            expect(testVni.outputState.previousLms).to.be.undefined;
        });

        describe("#clearTransientInputs", function() {

            it("should clear packet input on a VNI", function(done) {

                var présenter = "Puis-je me présenter";

                return test.createNetwork(

                    { inputNode: 'core/Repeat',
                      leNode: 
                         pipelineFactory({ 
                             description: "Un p'tit node avec un edge",
                             inPorts: {
                                 input: {
                                     datatype: 'string',
                                     required: true
                                 }
                             }
                          },
                          {fRunUpdater: function(vni) {
                               // verify we have the correct state on the VNI input port
                               test.verifyState(vni.inputStates()['input'], '', présenter);

                               // Clear the non-IIP port state(s), i.e., the input port state
                               vni.clearTransientInputs();
                               expect(vni.inputStates()['input']).to.be.undefined;

                               done();
                          }
                         })

                }).then(function(network) {

                    var leNode = network.processes.leNode.component;
                    network.graph.addEdge('inputNode', 'out', 'leNode', 'input');
                    network.graph.addInitial(présenter, 'inputNode', 'in');

                });
            });

            it("should not fail if socket is not initialized yet", function(done) {

                var enchanté = "Enchanté de faire votre connaissance";

                return test.createNetwork(

                    { leNode: 
                         pipelineFactory({ 
                             description: "Un p'tit node sans l'edge",
                             inPorts: {
                                 input: {
                                     datatype: 'string',
                                     required: true
                                 }
                             }
                          },
                          {fRunUpdater: function(vni) {
                               // verify we have the correct state on the VNI input port
                               test.verifyState(vni.inputStates()['input'], '', enchanté);

                               // Clear the non-IIP port state(s); since our only input port is an IIP,
                               // this should does nothing - state should remain as is.
                               vni.clearTransientInputs();
                               test.verifyState(vni.inputStates()['input'], '', enchanté);

                               done();
                          }
                         })

                }).then(function(network) {

                    var leNode = network.processes.leNode.component;
                    network.graph.addInitial(enchanté, 'leNode', 'input');

                });
            });


            it("should clear mixed IIP & packet input on a VNI", function(done) {

                var présenter = "Puis-je me présenter";
                var enchanté = "Enchanté de faire votre connaissance";

                return test.createNetwork(

                    { inputNode: 'core/Repeat',
                      leNode: 
                         pipelineFactory({ 
                             description: "Un p'tit node avec un edge et un IIP",
                             inPorts: {
                                 input: {
                                     datatype: 'string',
                                     required: true,
                                     multi: true
                                 }
                             }
                          },
                          {fRunUpdater: function(vni) {

                               // verify we have the correct state on the VNI input port
                               var inputStates = vni.inputStates()['input'];
                               inputStates.should.be.an('array');
                               inputStates.should.have.length(2);

                               // Since we have both IIP and edge, we should clear both
                               vni.clearTransientInputs();

                               inputStates = vni.inputStates()['input'];
                               inputStates.should.be.an('array');
                               inputStates.should.have.length(2);
                               expect(inputStates[0]).to.be.undefined;
                               expect(inputStates[1]).to.be.undefined;
              
                               done();
                           }
                         })

                }).then(function(network) {

                    var leNode = network.processes.leNode.component;
                    network.graph.addEdge('inputNode', 'out', 'leNode', 'input');

                    network.graph.addInitial(enchanté, 'leNode', 'input'); // send IIP
                    network.graph.addInitial(présenter, 'inputNode', 'in'); // feed inputNode which has edge to leNode

                });
            });
        });

        describe("#delete", function() {
            it("should delete the VNI", function() {

                Object.keys(node.vnis).should.have.length(0);

                var testVnid = '';
                var testVni = node.vni(testVnid);
                testVni.should.be.an('object');
                Object.keys(node.vnis).should.have.length(1);

                var result = testVni.delete();
                result.should.equal(node);
                Object.keys(node.vnis).should.have.length(0);

                // verify we get a different VNI instance back
                var testVni2 = node.vni(testVnid);
                testVni2.should.be.an('object');
                Object.keys(node.vnis).should.have.length(1);
            });
        });
   
        describe("#errorState", function() {
            it("should set and get errorState", function() {
    
                // create a vni
                var testVnid = '';
                var testVni = node.vni(testVnid);

                // Set up a test state
                var state = createState(testVnid,
                                         "Some error data",
                                        'LM1328113669.00000000000000001');

                // set error state
                var result = testVni.errorState(state);
                result.should.equal(testVni);

                // get error state
                var errState = testVni.errorState();

                // verify error state is as expected
                errState.should.be.an('object');
                errState.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 'componentName');
                errState.vnid.should.equal(testVnid);
                errState.data.should.equal(state.data);
                errState.lm.should.equal(state.lm);
                expect(errState.error).to.be.undefined;
                expect(errState.stale).to.be.undefined;
                expect(errState.groupLm).to.be.undefined;
                errState.componentName.should.equal('');
            });

            it("should clear error state", function() {
    
                var testVnid = '';
                var testVni = node.vni(testVnid);

                // Set up a test state
                var state = createState(testVnid,
                                         "Some error data",
                                        'LM1328113669.00000000000000001');

                // Test set state
                var result = testVni.errorState(state);
                result.should.equal(testVni);

                // Test clear state 
                var clearResult = testVni.errorState(undefined);
                clearResult.should.equal(testVni);

                // Test get of cleared state 
                var clearedState = testVni.errorState();
                expect(clearedState).to.be.an('undefined');
            });
        });

        describe("#inputState", function() {

            it("should set and get an inputState", function() {

                // Set up a test state
                var testVnid = '';
                var testLm =  'LM1328113669.00000000000000001';
                var testString = "Some input data";
                var state = createState(testVnid, testString, testLm);

                // Set state on the input port
                var result = node.vni().inputStates({input: state});

                // Verify we got a vni facade back
                result.should.be.an('object');
                result.should.include.keys('errorState', 'inputStates', 'outputState', 'nodeInstance');

                // Get the input states and verify they are as we expect
                var inputStates = node.vni().inputStates();
                inputStates.should.be.an('object');
                Object.keys(inputStates).should.have.length(1);
                inputStates.should.have.all.keys('input');
                inputStates.input.should.have.all.keys('vnid', 'data', 'lm', 'error', 'stale', 'groupLm', 'componentName');
                inputStates.input.vnid.should.equal(testVnid);
                inputStates.input.data.should.equal(testString);
                inputStates.input.lm.should.equal(testLm); 
                inputStates.input.componentName.should.equal('');
                expect(inputStates.input.error).to.be.undefined;
                expect(inputStates.input.stale).to.be.undefined;
                expect(inputStates.input.groupLm).to.be.undefined;
            });

            it("should delete an inputState", function() {
                // Set up a test state
                var testVnid = '';
                var testLm =  'LM1328113669.00000000000000001';
                var testString = "Some input data";
                var state = createState(testVnid, testString, testLm);

                // Set state on the input port
                var testVni = node.vni();
                var result = testVni.inputStates({input: state});

                // Verify we got a vni facade back
                result.should.be.an('object');
                result.should.include.keys('errorState', 'inputStates', 'outputState', 'nodeInstance');

                // Verify that we have an input state set now
                var inputStates = node.vni().inputStates();
                inputStates.should.be.an('object');
                
                // Now clear it
                var deleteContext = node.vni().inputStates({'input': undefined}); 
                deleteContext.should.be.an('object');
                var inputStates2 = node.vni().inputStates();
                inputStates.should.be.an('object');
                expect(inputStates2.input).to.be.an('undefined');
            });
        });

        describe("#outputState", function() {

            it("should set and get outputState", function() {

                var testVnid = '';
                var testVni = node.vni(testVnid);

                // Set up a test state
                var state = createState(testVnid, 
                                         "Some test data",
                                         'LM1328113669.00000000000000001');

                // Test set state
                var result = testVni.outputState(state);
                result.should.equal(testVni);

                // Test get state finds the expected output state
                var outState = testVni.outputState();
                outState.should.be.an('object');
                outState.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 'componentName');
                outState.vnid.should.equal(testVnid);
                outState.data.should.equal(state.data);
                outState.lm.should.equal(state.lm);
                expect(outState.error).to.be.undefined;
                expect(outState.stale).to.be.undefined;
                expect(outState.groupLm).to.be.undefined;
                outState.componentName.should.equal('');
            });

            it("should clear outputState", function() {
                var testVnid = '';
                var testVni = node.vni(testVnid);

                // Set up a test state
                var state = createState(testVnid, 
                                         "Some test data",
                                         'LM1328113669.00000000000000001');

                // Test set state
                var result = testVni.outputState(state);
                result.should.equal(testVni);

                // Test clearing the state 
                var clearResult = testVni.outputState(undefined);
                clearResult.should.equal(testVni);

                // Test get of cleared state 
                var clearedState = testVni.outputState();
                expect(clearedState).to.be.an('undefined');
            });
        });

    });

    describe("#deleteVni", function() {

        it("should delete the VNI by vnid", function() {

            Object.keys(node.vnis).should.have.length(0);

            // Create a VNI
            var testVnid = '';
            var testVni = node.vni(testVnid);
            testVni.should.be.an('object');
            Object.keys(node.vnis).should.have.length(1);

            // Delete it and verify it's gone
            var result = node.deleteVni(testVnid);
            result.should.equal(node);  
            Object.keys(node.vnis).should.have.length(0);

            // Create another VNI and verify it shows up
            var testVni3 = node.vni(testVnid);
            testVni3.should.be.an('object');
            Object.keys(node.vnis).should.have.length(1);
        });

    });
   
    describe("#deleteAllVnis", function() {

        it("should delete all VNIs associated with this node", function() {

            Object.keys(node.vnis).should.have.length(0);

            // Create 10 VNIs
            var myVnis = [];
            var numberOfVnis = 10;
            for (var i=0; i < numberOfVnis; i++) { 

                myVnis[i] = node.vni(i);
                myVnis[i].should.be.an('object');

                Object.keys(node.vnis).should.have.length(myVnis.length);
            }

            // Verify we got all 10
            Object.keys(node.vnis).should.have.length(numberOfVnis);

            // Delete the VNIs and verify they are all gone 
            var result = node.deleteAllVnis();
            result.should.equal(node);
            Object.keys(node.vnis).should.have.length(0);
        });

    });

    describe('functional behavior', function() {

        it('should get vni with input, output, and error state for a component in a noflo network', function() {
            var attributeName = 'MeadowFarmCows';
            var attributeValue = 'Brindle and Bessie, Jenny and Boss';

            return test.createNetwork(
                 {rdfObject: 'rdf-components/object',
                  omega: 'core/Output'}

           ).then(function(network) {
                var rdfObject = network.processes.rdfObject.component;
                var omega = network.processes.omega.component;

                return new Promise(function(done, fail) {

                    test.onOutPortData(omega, 'out', done);

                    network.graph.addEdge('rdfObject', 'output', 'omega', 'in');

                    sinon.stub(console,'log');
                    network.graph.addInitial(attributeName, 'rdfObject', 'key');
                    network.graph.addInitial(attributeValue, 'rdfObject', 'value');

                }).then(function(done) {
                    console.log.restore();
                    done.should.be.an('object');
                    done.vnid.should.equal('');
                    expect(done.error).to.be.undefined;
                    expect(done.stale).to.be.undefined;
                    expect(done.groupLm).to.be.undefined;
                    done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                    done.componentName.should.equal('rdf-components/object');
                }, function(fail) {
                    console.error(fail);
                    console.log.restore();
                    throw Error(fail);
                });
            });
        });
    });

});
