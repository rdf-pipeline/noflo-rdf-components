/**
 * File: vni-manager-mocha.js
 * Unit tests for the vni APIs defined in src/vni-manager.js
 */

var _ = require('underscore');

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var componentFactory = require('../src/noflo-component-factory');
var pipelineFactory = require('../src/pipeline-component-factory');

var createLm = require('../src/create-lm');
var createState = require('../src/create-state');
var inputStates = require('../src/input-states');

var profiler = require('../src/profiler');
var vniManager = require('../src/vni-manager');
var wrapperHelper = require('../src/wrapper-helper');

var promiseOutput = require('../src/promise-output');

var test = require('./common-test');

var componentName = 'enchanted';

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
	    this.timeout(3000);
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

        it("should increment & decrement the totalVnis and totalDefaultVnis counters on VNI creation and deletion", function() {

            var nodeInstance;
            var testData = "Creativity is intelligence having fun";
            var vnisToCreate = 5;

            return test.createNetwork({
                node: {getComponent: pipelineFactory({
                                         inPorts: {input: {}},
                                         outPorts: {output: {}},
                                     },
                                     {fRunUpdater: function(vni,input) {
                                          nodeInstance = vni.nodeInstance;
                                          profiler.pipelineMetrics.totalDefaultVnis.should.equal(1);

                                          // create 5 VNIs in addition to our default '' vni
                                          for (var i=1; i <= input; i++) {
                                               nodeInstance.vni(i);
                                               profiler.pipelineMetrics.totalVnis.should.equal(i+1);
                                          }

                                          vni.outputState({data: testData,
                                                           lm: createLm()});
                                      }}
                )}
            }).then(function(network){

                 var node = network.processes.node.component;

                 return new Promise(function(done, fail) {

                     test.onOutPortData(node, 'output', done);

                     // Clear VNI counts that may have been set earlier in this test so we can get a good count
                     _.map(profiler.pipelineMetrics,function(value, key) { 
                         profiler.pipelineMetrics[key] = 0;
                     });

                     network.graph.addInitial(vnisToCreate, 'node', 'input');
                 }).then(function(done) {
                     test.verifyState(done, '', testData);

                     // Verify default VNI has been cleared
                     expect(nodeInstance).to.not.be.empty;
                     nodeInstance.vnis.should.be.an('object');
                     var vnids = Object.keys(nodeInstance.vnis);
                     vnids.should.have.length(vnisToCreate+1); // default vnid plus the 5 new ones updater created

                     profiler.pipelineMetrics.totalVnis.should.equal(vnids.length);
                     profiler.pipelineMetrics.totalDefaultVnis.should.equal(1);

                     // Now walk the list of VNIs deleting them and verifying that the counts decrement
                     var vniCount = vnids.length;
                     _.map(nodeInstance.vnis, function(value, key) { 
                         nodeInstance.deleteVni(key); 
                         profiler.pipelineMetrics.totalVnis.should.equal(--vniCount);
                     });

                 });
            });
        });

        it("should decrement the totalVnis and totalDefaultVnis counters when all VNIs are deleted", function() {

            var nodeInstance;
            var testData = "The best road to progress is freedom's road.";
            var vnisToCreate = 5;

            return test.createNetwork({
                node: {getComponent: pipelineFactory({
                                         inPorts: {input: {}},
                                         outPorts: {output: {}},
                                     },
                                     {fRunUpdater: function(vni,input) {
                                          nodeInstance = vni.nodeInstance;
                                          profiler.pipelineMetrics.totalDefaultVnis.should.equal(1);

                                          // create 5 VNIs in addition to our default '' vni
                                          for (var i=1; i <= input; i++) {
                                               nodeInstance.vni(i);
                                          }

                                          profiler.pipelineMetrics.totalVnis.should.equal(input+1);
                                          vni.outputState({data: testData,
                                                           lm: createLm()});
                                      }}
                )}
            }).then(function(network){

                 var node = network.processes.node.component;

                 return new Promise(function(done, fail) {

                     test.onOutPortData(node, 'output', done);

                     // Clear VNI counts that may have been set earlier in this test so we can get a good count
                     _.map(profiler.pipelineMetrics,function(value, key) { 
                         profiler.pipelineMetrics[key] = 0;
                     });

                     network.graph.addInitial(vnisToCreate, 'node', 'input');

                 }).then(function(done) {
                     test.verifyState(done, '', testData);

                     // Verify default VNI has been cleared
                     expect(nodeInstance).to.not.be.empty;
                     nodeInstance.vnis.should.be.an('object');

                     var vnids = Object.keys(nodeInstance.vnis);
                     vnids.should.have.length(vnisToCreate+1); 

                     profiler.pipelineMetrics.totalVnis.should.equal(vnids.length);
                     profiler.pipelineMetrics.totalDefaultVnis.should.equal(1);

                     nodeInstance.deleteAllVnis(); 

                     profiler.pipelineMetrics.totalVnis.should.equal(0);
                     profiler.pipelineMetrics.totalDefaultVnis.should.equal(0);
                 });
            });
        });

        describe("#clearTransientInputs", function() {

            it("should not delete single IIP VNIs", function() {
                var attributeName = 'MeadowFarm';
                var attributeValue = 'Nelly';
                var nodeVni;

                return test.createNetwork({
                    node: {getComponent: pipelineFactory({
                                         inPorts: {key: {}, value: {}},
                                         outPorts: {output: {}},
                                     },
                                     {fRunUpdater: function(vni) {
                                         var updaterActuals = 
                                             wrapperHelper.getUpdaterParameters(vni, ['key', 'value']);
                                         var key = updaterActuals[0];
                                         var value = updaterActuals[1];

                                          // stash the VNI so we can look at it later
                                          nodeVni = vni;
 
                                          // Verify we have expected key/value states
                                          var states = vni.inputStates();
                                          test.verifyState(states.key, '', attributeName);
                                          test.verifyState(states.value, '', attributeValue);
                                     
                                          vni.clearTransientInputs();

                                          // Verify we still have the same key/value states
                                          states = vni.inputStates();
                                          test.verifyState(states.key, '', attributeName);
                                          test.verifyState(states.value, '', attributeValue);

                                          vni.outputState({data: { [key]: value},
                                                           lm: createLm()});
                                      }}
                    )},
                    omega: 'core/Output'

               }).then(function(network) {
                   var omega = network.processes.omega.component;
                   network.graph.addEdge('node', 'output', 'omega', 'in');

                   return new Promise(function(done, fail) {

                       test.onOutPortData(omega, 'out', done);

                       sinon.stub(console,'log');
                       network.graph.addInitial(attributeName, 'node', 'key');
                       network.graph.addInitial(attributeValue, 'node', 'value');

                   }).then(function(done) {
                       console.log.restore();
                       test.verifyState(done, '', {[attributeName]: attributeValue});

                       // Verify we still have the same input states on the VNI
                       states = nodeVni.inputStates();
                       test.verifyState(states.key, '', attributeName);
                       test.verifyState(states.value, '', attributeValue);
                
                   }, function(fail) {
                       console.error(fail);
                       console.log.restore();
                       throw Error(fail);
                   });
               });
           });

           it("should delete mixed IIP/packet VNIs", function() {
                var attributeName = 'MeadowFarm';
                var attributeValue = 'Brindle';
                var nodeVni;

                return test.createNetwork({
                    repeater: 'core/Repeat',
                    node: {getComponent: pipelineFactory({
                                         inPorts: {key: {}, value: {}},
                                         outPorts: {output: {}},
                                     },
                                     {fRunUpdater: function(vni) {
                                         var updaterActuals = 
                                             wrapperHelper.getUpdaterParameters(vni, ['key', 'value']);
                                         var key = updaterActuals[0];
                                         var value = updaterActuals[1];

                                          // stash the VNI so we can look at it later
                                          nodeVni = vni;
 
                                          // Verify we have expected key/value states
                                          var states = vni.inputStates();
                                          test.verifyState(states.key, '', attributeName);
                                          test.verifyState(states.value, '', attributeValue);
                                     
                                          vni.clearTransientInputs();

                                          // Verify we still have the same key, but value is cleared
                                          states = vni.inputStates();
                                          test.verifyState(states.key, '', attributeName);
                                          expect(states.value).to.be.undefined;

                                          vni.outputState({data: { [key]: value},
                                                           lm: createLm()});
                                      }}
                    )},
                    omega: 'core/Output'

               }).then(function(network) {
                   var omega = network.processes.omega.component;

                   // Set up an edge though we won't use it 
                   network.graph.addEdge('repeater', 'out', 'node', 'value');

                   network.graph.addEdge('node', 'output', 'omega', 'in');

                   return new Promise(function(done, fail) {

                       test.onOutPortData(omega, 'out', done);

                       sinon.stub(console,'log');

                       // Send IIP input to the node
                       network.graph.addInitial(attributeName, 'node', 'key');
                       network.graph.addInitial(attributeValue, 'node', 'value'); 

                   }).then(function(done) {
                       console.log.restore();
                       test.verifyState(done, '', {[attributeName]: attributeValue});

                       // Verify we still have the same key, but value is cleared
                       states = nodeVni.inputStates();
                       test.verifyState(states.key, '', attributeName);
                       expect(states.value).to.be.undefined;
                
                   }, function(fail) {
                       console.error(fail);
                       console.log.restore();
                       throw Error(fail);
                   });
               });
           });

           it("should delete single packet input VNI", function() {
                var attributeName = 'MeadowFarm';
                var attributeValue = 'Bessie';
                var nodeVni;

                return test.createNetwork({
                    repeater: 'core/Repeat',
                    node: {getComponent: pipelineFactory({
                                         inPorts: {key: {}, value: {}},
                                         outPorts: {output: {}},
                                     },
                                     {fRunUpdater: function(vni) {
                                         var updaterActuals = 
                                             wrapperHelper.getUpdaterParameters(vni, ['key', 'value']);
                                         var key = updaterActuals[0];
                                         var value = updaterActuals[1];

                                          // stash the VNI so we can look at it later
                                          nodeVni = vni;
 
                                          // Verify we have expected key/value states
                                          var states = vni.inputStates();
                                          test.verifyState(states.key, '', attributeName);
                                          test.verifyState(states.value, '', attributeValue);
                                     
                                          vni.clearTransientInputs();

                                          // Verify we still have the same key, but value is cleared
                                          states = vni.inputStates();
                                          test.verifyState(states.key, '', attributeName);
                                          expect(states.value).to.be.undefined;

                                          vni.outputState({data: { [key]: value},
                                                           lm: createLm()});
                                      }}
                    )},
                    omega: 'core/Output'

               }).then(function(network) {
                   var omega = network.processes.omega.component;
                   network.graph.addEdge('repeater', 'out', 'node', 'value');
                   network.graph.addEdge('node', 'output', 'omega', 'in');

                   return new Promise(function(done, fail) {

                       test.onOutPortData(omega, 'out', done);

                       sinon.stub(console,'log');
                       network.graph.addInitial(attributeName, 'node', 'key');
                       network.graph.addInitial(attributeValue, 'repeater', 'in');

                   }).then(function(done) {
                       console.log.restore();
                       test.verifyState(done, '', {[attributeName]: attributeValue});

                       // Verify we still have the same key, but value is cleared
                       states = nodeVni.inputStates();
                       test.verifyState(states.key, '', attributeName);
                       expect(states.value).to.be.undefined;
                
                   }, function(fail) {
                       console.error(fail);
                       console.log.restore();
                       throw Error(fail);
                   });
               });
           });

           it("should delete a multi packet input VNI", function() {
                var attributeName = 'MeadowFarm';
                var attributeValue1 = 'Jenny';
                var attributeValue2 = 'Boss';
                var nodeVni;

                return test.createNetwork({
                    repeater1: 'core/Repeat',
                    repeater2: 'core/Repeat',
                    node: {getComponent: pipelineFactory({
                                         inPorts: {key: {}, value: {multi: true}},
                                         outPorts: {output: {}},
                                     },
                                     {fRunUpdater: function(vni) {
                                         var updaterActuals = 
                                             wrapperHelper.getUpdaterParameters(vni, ['key', 'value']);
                                         var key = updaterActuals[0];
                                         var values = updaterActuals[1];

                                          // stash the VNI so we can look at it later
                                          nodeVni = vni;
 
                                          // Verify we have expected key/value states
                                          var states = vni.inputStates();
                                          test.verifyState(states.key, '', attributeName);
                                          test.verifyState(states.value[0], '', attributeValue1);
                                          test.verifyState(states.value[1], '', attributeValue2);

                                          vni.clearTransientInputs();

                                          // Verify that key is still there, but both values cleared
                                          var states = vni.inputStates();
                                          test.verifyState(states.key, '', attributeName);
                                          expect(states.value[0]).to.be.undefined;
                                          expect(states.value[1]).to.be.undefined;

                                          vni.outputState({data: {[key]: values[0] + " & " + values[1]},
                                                           lm: createLm()});
                                      }}
                    )},
                    omega: 'core/Output'

               }).then(function(network) {
                   var omega = network.processes.omega.component;
                   network.graph.addEdge('repeater1', 'out', 'node', 'value');
                   network.graph.addEdge('repeater2', 'out', 'node', 'value');
                   network.graph.addEdge('node', 'output', 'omega', 'in');

                   return new Promise(function(done) {

                       test.onOutPortData(omega, 'out', done);

                       sinon.stub(console,'log');
                       network.graph.addInitial(attributeName, 'node', 'key');
                       network.graph.addInitial(attributeValue1, 'repeater1', 'in');
                       network.graph.addInitial(attributeValue2, 'repeater2', 'in');

                   }).then(function(done) {
                       console.log.restore();
                       test.verifyState(done, '', {[attributeName]: 'Jenny & Boss'});

                       // Verify we still have the same key, but value is cleared
                       states = nodeVni.inputStates();
                       test.verifyState(states.key, '', attributeName);
                       expect(states.value[0]).to.be.undefined;
                       expect(states.value[1]).to.be.undefined;
                   });
               });

           });
        });

    });
});
