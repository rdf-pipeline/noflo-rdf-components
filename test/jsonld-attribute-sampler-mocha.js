// jsonld-attribute-sampler-mocha.js

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

var _ = require('underscore');
var fs = require('fs');
var os = require('os');

var factory = require('../components/jsonld-attribute-sampler');
var stateFactory = require('../src/create-state');

var logger = require('../src/logger');
var test = require('./common-test');

describe('jsonld-attribute-sampler', function() {

    it("should exist as a function", function() {
        factory.should.exist;
        factory.should.be.a('function');
    });

    it("should instantiate a noflo component", function() {
        var node = test.createComponent(factory);
        node.should.be.an('object');
        node.should.include.keys('nodeName', 'componentName', 'outPorts', 'inPorts', 'vni', 'vnis');
    });

    describe('#updater', function() {

        it("should throw an error if no arguments specified", function() {
            var node = test.createComponent(factory);
            expect(factory.updater.bind(node.vni(''))).to.throw(Error,
                /jsonld-attribute-sampler requires jsonld data to analyze!/);
        });

        it("should throw an error if no graph was specified", function() {
            var node = test.createComponent(factory);
            expect(factory.updater.bind(node.vni(''), 'some data')).to.throw(Error,
                /jsonld-attribute-sampler requires jsonld data to analyze!/);
        });

        it("should throw an error if no identifier is found", function() {
            var node = test.createComponent(factory);
            var data = 
                {"@context": "https://raw.githubusercontent.com/rdf-pipeline/translators/master/data/fake_cmumps/patient-7/context.jsonld",
                 "@graph": [
                    {
                      "type": "cmumpss:Patient-2",
                      "_id": "2-000007",
                      "identifier": "2-000007",
                   }
                 ]
               };
            expect(factory.updater.bind(node.vni(''), data)).to.throw(Error,
                /jsonld-attribute-sampler no identifier found for metadata key: id/);
        });

        it("should throw an error if bad type was specified", function() {
            var node = test.createComponent(factory);
            vni = node.vni('');

            var data = 
                {"@context": "https://raw.githubusercontent.com/rdf-pipeline/translators/master/data/fake_cmumps/patient-7/context.jsonld",
                 "@graph": [
                    {
                      "type": "cmumpss:Patient-2",
                      "_id": "2-000007",
                      "identifier": "2-000007",
                   }
                 ]
               };

            var state = stateFactory('', data);
            state['patientId'] = "2-000007";
            vni.inputStates({'data': state});

            expect(factory.updater.bind(vni, data, '/tmp/', 'patientId', 'bad-type')).to.throw(Error,
                /Jsonld attribute sample found unexpected type: bad-type!/);
        });

        it("should find for new json pointers at start up", function(done) {

            var node = test.createComponent(factory);
            vni = node.vni('');

            var data = 
                {"@context": "https://raw.githubusercontent.com/rdf-pipeline/translators/master/data/fake_cmumps/patient-7/context.jsonld",
                 "@graph": [
                    {
                      "type": "cmumpss:Patient-2",
                      "_id": "2-000007",
                      "identifier": "2-000007",
                   }
                 ]
               };
            var state = stateFactory('', data);
            state['patientId'] = "2-000007";
            vni.inputStates({'data': state});

            var targetDir = '/tmp/';
            var jsonpointersFile = targetDir + 'jsonpointers-all.json';
            var sampleFile = targetDir + 'all:2-000007.txt';

            // Cleanup expected files if they are already there
            cleanup([jsonpointersFile, sampleFile]);

            return new Promise(function(resolve, fail) {

                logger.silence('warn');
                var result = factory.updater.call(vni, data, targetDir, 'patientId');
                resolve(result);

            }).then(function(result) {
                logger.verbose('warn');
                result.should.deep.equal(data);
  
                // Check that we created the jsonpointers summary file and it has the right content
                if (!fs.existsSync(jsonpointersFile)) {
                    throw Error("    Jsonld attribute sampler failed to create json pointers file " + jsonpointersFile + "!");
                }
                var jsonpointersFileContents = fs.readFileSync(jsonpointersFile, 'utf-8');
                JSON.parse(jsonpointersFileContents).should.deep.equal({"/type": "cmumpss:Patient-2",
                                                                    "/_id": "2-000007",
                                                                    "/identifier": "2-000007"});

                // Check that we created a sample file from the data we passed in
                if (!fs.existsSync(sampleFile)) {
                    throw Error("    Jsonld attribute sampler failed to create sample file " + sampleFile + "!");
                }
                var sampleFileContents = fs.readFileSync(sampleFile, 'utf-8');
                JSON.parse(sampleFileContents).should.deep.equal(data);

                // It all looks good, so clean up now
                cleanup([jsonpointersFile, sampleFile]);
      
                done();
            }).catch(function(e) { 
                logger.verbose('warn');
                console.error("    Jsonld-attribute sampler start up test exception: "+e);
            }); 
        }); 

        it("should find for new json pointers as new demographics data arrive", function(done) {

            var data0 = 
                {"@context": "https://raw.githubusercontent.com/rdf-pipeline/translators/master/data/fake_cmumps/patient-7/context.jsonld",
                 "@graph": [{
                      "_id": "2-000007",
                      "type": "cmumpss:Patient-2",
                      "identifier": "2-000007"
                 }]
               };
            var data1 = 
                {"@context": "https://raw.githubusercontent.com/rdf-pipeline/translators/master/data/fake_cmumps/patient-8/context.jsonld",
                 "@graph": [{
                      "_id": "2-000008",
                      "type": "cmumpss:Patient-2",
                      "identifier": "2-000008",
                      "label": "BUNNY,BUGS",
                      "phone-2" : "555 555 5555"
                  }]
               };

            var expectedJsonPointers = {"/type": "cmumpss:Patient-2",
                                        "/_id": "2-000007",
                                        "/identifier": "2-000007",
                                        "/label": "BUNNY,BUGS",
                                        "/phone-2": "555 555 5555"}

            return processDatasets('demographics', 
                                   [data0, data1],
                                   ["2-000007", "2-000008"], 
                                   expectedJsonPointers,
                                   [data0["@graph"], data1["@graph"]], 
                                   done);
        });

        it("should find for new json pointers as new diagnoses data arrive", function(done) {

            var data0 = 
                {"@context": "https://raw.githubusercontent.com/rdf-pipeline/translators/master/data/fake_cmumps/patient-7/context.jsonld",
                 "@graph": [{
                      _id: '100417-4559064',
                      type: 'cmumpss:Kg_Patient_Diagnosis-100417',
                      label: '27642;OTHER EXAMINATION DEFINED POPULATION',
                      'problem-100417': '27642;OTHER EXAMINATION DEFINED POPULATION'
                 }]
               };
            var data1 = 
                {"@context": "https://raw.githubusercontent.com/rdf-pipeline/translators/master/data/fake_cmumps/patient-8/context.jsonld",
                 "@graph": [{
                     _id: '100417-4562039',
                     type: 'cmumpss:Kg_Patient_Diagnosis-100417',
                     label: '27224;ENCOUNTER FOR HEARING CONSERVATION AND TREATMENT',
                     'problem-100417': '27224;ENCOUNTER FOR HEARING CONSERVATION AND TREATMENT',
                     'status-100417': 'Active',
                     'diagnosis-100417': 'V72.12'
                   }]
               };

            var expectedJsonPointers = {
	        "/_id": "100417-4559064",
	        "/type": "cmumpss:Kg_Patient_Diagnosis-100417",
	        "/label": "27642;OTHER EXAMINATION DEFINED POPULATION",
	        "/problem-100417": "27642;OTHER EXAMINATION DEFINED POPULATION",
	        "/status-100417": "Active",
	        "/diagnosis-100417": "V72.12"
            };

            return processDatasets('diagnoses', 
                                   [data0, data1],
                                   ["2-000007", "2-000008"], 
                                   expectedJsonPointers,
                                   [data0["@graph"], data1["@graph"]], 
                                   done);
        });

        it("should find for new json pointers as new procedures data arrive", function(done) {

            var data0 = 
                {"@context": "https://raw.githubusercontent.com/rdf-pipeline/translators/master/data/fake_cmumps/patient-7/context.jsonld",
                 "@graph": [{
                     _id: 'Procedure-1074046',
                     type: 'Procedure',
                     label: 'Periodic comprehensive preventive medicine reevaluation and management of an individual including an age and gender appropriate history, examination, counseling/anticipatory guidance/risk factor reduction interventions, and the ordering of appropriat',
                 }]
               };
            var data1 = 
                {"@context": "https://raw.githubusercontent.com/rdf-pipeline/translators/master/data/fake_cmumps/patient-8/context.jsonld",
                 "@graph": [{
                     _id: 'Procedure-1074047',
                     type: 'Procedure',
                     patient: { id: 'Patient-000007', label: 'BUNNY, BUGS' }
                   }]
               };

            var expectedJsonPointers = {
                "/_id": "Procedure-1074046",
	        "/type": "Procedure",
	        "/label": "Periodic comprehensive preventive medicine reevaluation and management of an individual including an age and gender appropriate history, examination, counseling/anticipatory guidance/risk factor reduction interventions, and the ordering of appropriat",
	        "/patient/id": "Patient-000007",
	        "/patient/label": "BUNNY, BUGS"
            };

            return processDatasets('procedures', 
                                   [data0, data1],
                                   ["2-000007", "2-000008"], 
                                   expectedJsonPointers,
                                   [data0["@graph"], data1["@graph"]], 
                                   done);
        });

    }); // describe updater

    describe('functional behavior', function() {

        it('should run in  a noflo network', function() {

            var data = 
                {"@context": "https://raw.githubusercontent.com/rdf-pipeline/translators/master/data/fake_cmumps/patient-7/context.jsonld",
                 "@graph": [
                    {
                      "_id": "52-40863",
                      "type": "cmumpss:Prescription-52",
                      "label": "H46358",
                      'rx_-52': "H46358"
                   }
                 ]
            };

            var targetDir = '/tmp/';
            var jsonpointersFile = targetDir + 'jsonpointers-prescriptions.json';
            var sampleFile = targetDir + 'prescriptions:2-000007.txt';

            // Cleanup expected files if they are already there
            cleanup([jsonpointersFile, sampleFile]);

            return test.createNetwork(
                 { dataRepeater: 'core/Repeat',
                   metadataRepeater: 'core/Repeat',
                   addMetadata: 'rdf-components/add-metadata',
                   jsonldAttrSampler: 'rdf-components/jsonld-attribute-sampler' }

            ).then(function(network) {

                var dataRepeater = network.processes.dataRepeater.component;
                var metadataRepeater = network.processes.metadataRepeater.component;
                var addMetadata = network.processes.addMetadata.component;
                var jsonldAttrSampler = network.processes.jsonldAttrSampler.component;

                network.graph.addEdge('metadataRepeater', 'out', 'addMetadata', 'metadata');
                network.graph.addEdge('dataRepeater', 'out', 'addMetadata', 'data');
                network.graph.addEdge('addMetadata', 'output', 'jsonldAttrSampler', 'data');

                return new Promise(function(done, fail) {
            test.onOutPortData(jsonldAttrSampler, 'output', done);

                    network.graph.addInitial('/tmp/', 'jsonldAttrSampler', 'target_dir');
                    network.graph.addInitial('patientId', 'jsonldAttrSampler', 'metadata_key');
                    network.graph.addInitial('prescriptions', 'jsonldAttrSampler', 'type');

                    network.graph.addInitial({"patientId": "2-000007"}, 'metadataRepeater', 'in');
                    network.graph.addInitial(data, 'dataRepeater', 'in');

                }).then(function(done) {
                    test.verifyState(done, '', data)
                    done.patientId.should.equal('2-000007');
                    done.componentName.should.equal('rdf-components/jsonld-attribute-sampler');

                    if (!fs.existsSync(jsonpointersFile)) {
                        throw Error("    Jsonld attribute sampler failed to create json pointers file " + jsonpointersFile + "!");
                    }
                    var jsonpointersFileContents = fs.readFileSync(jsonpointersFile, 'utf-8');
                    JSON.parse(jsonpointersFileContents).should.deep.equal({"/_id": "52-40863",
                                                                        "/type": "cmumpss:Prescription-52",
                                                                        "/label": "H46358",
                                                                        "/rx_-52": "H46358"});

                    if (!fs.existsSync(sampleFile)) {
                        throw Error("    Jsonld attribute sampler failed to create sample file " + sampleFile + "!");
                    }
                    var sampleFileContents = fs.readFileSync(sampleFile, 'utf-8');
                    JSON.parse(sampleFileContents).should.deep.equal(data["@graph"]);
    
                    cleanup([jsonpointersFile, sampleFile]);
                });
            }).catch(function(e) {
                var msg = "Jsonld Attr Sampler failed in a network"+e;
                console.error(msg);
                throw Error(msg);
            });

        });

    });
});


function processDatasets(type, data, patientIds, jsonpointerResults, sampleResults, doneCB) { 

    var node = test.createComponent(factory);
    vni = node.vni('');

    var targetDir = '/tmp/';
    var jsonpointersFile = targetDir + "jsonpointers-" + type + ".json";
    var sampleFile1 = targetDir + type + ":" + patientIds[0] + ".txt";
    var sampleFile2 = targetDir + type + ":" + patientIds[1] + ".txt";

    // Cleanup expected files if they are already there
    cleanup([jsonpointersFile, sampleFile1, sampleFile2]);

    // Set input state that the framework/javascript wrapper would usually set
    var state = stateFactory('', data[0]);
    state['patientId'] = patientIds[0];
    vni.inputStates({'data': state});

    return new Promise(function(resolve) {
        // Call updater for first dataset
        logger.silence('warn');
        var result = factory.updater.call(vni, data[0], targetDir, 'patientId', type);
        resolve(result);
    }).then(function(result) {
        // Verify we got the expected data and that the two expected files were created
        logger.verbose('warn');
        result.should.deep.equal(data[0]);

        // Check that we created the jsonpointers summary file and it has the right content
        if (!fs.existsSync(jsonpointersFile)) throw Error("    Jsonld attribute sampler failed to create json pointers file " + jsonpointersFile + "!");

        // Check that we created a sample file from the data we passed in
        if (!fs.existsSync(sampleFile1)) throw Error("    Jsonld attribute sampler failed to create sample file " + sampleFile1 + "!");

        // Send another dataset
        return new Promise(function(resolve2) {

            // Set input state for his dataset - usually done by framework/wrapper
            state.data = data[1];
            state.patientId = patientIds[1];
            vni.inputStates({'data': state});

            // Call updater
            logger.silence('warn');
            var result = factory.updater.call(vni, data[1], targetDir, 'patientId', type);
            resolve2(result);

        }).then(function(result2) {

            // Verify we have the expected content in json pointers, which is a mix of the two dataset
            var jsonpointersFileContents = fs.readFileSync(jsonpointersFile, 'utf-8');
            JSON.parse(jsonpointersFileContents).should.deep.equal(jsonpointerResults);

            if (!fs.existsSync(sampleFile2)) throw Error("    Jsonld attribute sampler failed to create sample file " + sampleFile2 + "!");

            // Verify that both sample files have the expected content
            var sampleFileContents = fs.readFileSync(sampleFile1, 'utf-8');
            JSON.parse(sampleFileContents).should.deep.equal(data[0]["@graph"]);

            sampleFileContents = fs.readFileSync(sampleFile2, 'utf-8');
            JSON.parse(sampleFileContents).should.deep.equal(data[1]["@graph"]);

            // It all looks good, so clean up now
            cleanup([jsonpointersFile, sampleFile1, sampleFile2]);

            doneCB();
        });
    }).catch(function(e) { 
        logger.verbose('warn');
        logger.error("    Jsonld-attribute sampler data procesing test exception: "+e);
    }); 
}

function cleanup(filepaths) { 

    filepaths.forEach(function(filepath) {
        try { 
            if (fs.existsSync(filepath)) { 
                fs.unlinkSync(filepath);
            }
        } catch(e) {
            logger.error('unable to remove file ',filepath);
        }
    });

}
