// add-metadata-mocha.js

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var test = require('./common-test');
var factory = require('../components/add-metadata');

describe("add-metadata", function() {

    it("should exist as a function", function() {
        factory.should.exist;
        factory.should.be.a('function');
    });

    it("should instantiate a noflo component", function() {
        var node = test.createComponent(factory);
        node.should.be.an('object');
        node.should.include.keys('nodeName', 'componentName', 'outPorts', 'inPorts', 'vni', 'vnis');
    });

    describe("#updater", function() {

        it("should throw an error if no metadata name was specified", function() {
            expect(factory.updater.bind(this, undefined)).to.throw(Error,
                /Expected a metadata object found with attributes to be added to the VNI!/);
        });

        it("should should set metadata and return whatever the current VNI data is", function() {
           // Instantiate a component and set the VNI data 
           var node = test.createComponent(factory);
           var vni = node.vni('');
           vni.data = testdata;

           var metadata = { Metagenes: 'Temple of Artemis',
                            Sinan: 'Şehzade Mosque',
                            Brunelleschi: 'the Duomo'};
           var testdata = 'A real building is one on which the eye can light and stay lit.';

           var result = factory.updater.call(vni, metadata, testdata);
           result.should.equal(testdata);

           vni.should.include.keys('data', 'delete', 'vnid', 'inputStates', 'outputState', 
                                   'errorState', 'nodeInstance');

           var outputState = vni.outputState();
           test.verifyState(outputState , '');
           Object.keys(metadata).forEach( function(key) {
               metadata[key].should.equal(outputState[key]);
           });
        });
    });

    describe("functional behavior", function() {

        it("should add metadata in a noflo network", function() {
	   this.timeout(3000);
           var testMetadata = {"Pei": "JFK Library", "Richardson": "Old Colony station", "Wright": "Falling Water"};
           var testData = {"Churchill": "We shape our buildings; thereafter they shape us."}; 

            return test.createNetwork(
                 { metadata: 'rdf-components/parse-json',
                   data: 'rdf-components/parse-json',
                   addMetadata: 'rdf-components/add-metadata',
                   finito: 'core/Output'}

           ).then(function(network) {

                var metadata = network.processes.metadata.component;
                var data = network.processes.data.component;
                var addMetadata = network.processes.addMetadata.component;
                var finito = network.processes.finito.component;

                return new Promise(function(done, fail) {

                    test.onOutPortData(finito, 'out', done);
        
                    network.graph.addEdge('data', 'output', 'addMetadata', 'data');
                    network.graph.addEdge('metadata', 'output', 'addMetadata', 'metadata');
                    network.graph.addEdge('addMetadata', 'output', 'finito', 'in');

                    sinon.stub(console,'log');
                    network.graph.addInitial(JSON.stringify(testData), 'data', 'input');
                    network.graph.addInitial(JSON.stringify(testMetadata), 'metadata', 'input');

                }).then(function(done) {
console.log("SUCCESS\n");
                    console.log.restore();
                    done.should.be.an('object');
                    test.verifyState(done, '', testData);
                    var metadataKeys = Object.keys(testMetadata);
                    metadataKeys.forEach( function(key) {
                        testMetadata[key].should.equal(done[key]);
                    });
                }, function(fail) {
console.log("FAILURE\n");
                    console.error(fail);
                    console.log.restore();
                    throw Error(fail);
                }); 
            }); 
        });

    });
});
