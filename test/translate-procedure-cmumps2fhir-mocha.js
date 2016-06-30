// translate-procedure-cmumps2fhir-mocha.js

var chai = require('chai');

var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var _ = require('underscore');
var fs = require('fs');

var extractor = require('translators').cmumps;

var factory = require('../components/translate-procedure-cmumps2fhir');
var logger = require('../src/logger');
var test = require('./common-test');

var testFile = __dirname + '/data/cmumps-patient7.jsonld';

describe('translate-procedure-cmumps2fhir', function() {

    it('should exist as a function', function() {
        factory.should.exist;
        factory.should.be.a('function');
    });

    it('should instantiate a noflo component', function() {
        var node = test.createComponent(factory);
        node.should.be.an('object');
        node.should.include.keys('nodeName', 'componentName', 'outPorts', 'inPorts', 'vni', 'vnis');
    });

    describe('#updater', function() {

        it('should throw an error if data is undefined', function() {
            expect(factory.updater.bind(this, undefined)).to.throw(Error,
                /No patient procedure data to translate!/);
        });

        it('should return empty object if data is empty', function() {
            expect(factory.updater({})).to.be.empty;
        });

        it('should convert patient procedures to fhir', function() {
            var data = fs.readFileSync(testFile);
            var parsedData = JSON.parse(data); // readfile gives us a json object, so parse it
            var procedures = extractor.extractProcedures(parsedData);
            var translation = factory.updater(procedures);
            translation.should.not.be.empty;
            translation.should.be.an('array');
            translation.should.have.length(1);
            translation[0].should.include.keys('resourceType', 'identifier', 'subject', 'status',
                                               'category', 'code', 'performedDateTime', 'encounter');
            translation[0].resourceType.should.equal('Procedure');
        });

        it('should write data to the specified intermediate files', function() {

            var data = fs.readFileSync(testFile);
            var parsedData = JSON.parse(data); // readfile gives us a json object, so parse it
            var procedures = extractor.extractProcedures(parsedData);

            var cmumpsFile='/tmp/cmumpsProcedures.out';
            var fhirFile='/tmp/fhirProcedures.out';
            test.rmFile(cmumpsFile);
            test.rmFile(fhirFile);

            var translation = factory.updater(procedures, cmumpsFile, fhirFile);
            translation.should.not.be.empty;

            // Verify the expected 2 files exist
            fs.accessSync(cmumpsFile, fs.F_OK);
            fs.accessSync(fhirFile, fs.F_OK);
        });
    });

    describe('functional behavior', function() {
       it('should convert patient procedures to fhir in a noflo network', function() {
           return test.createNetwork(
                { repeaterNode: 'core/Repeat',
                  patientHashNode: 'rdf-components/patient-hash',
                  cmumpsFileNode: 'core/Repeat',
                  fhirFileNode: 'core/Repeat',
                  translatorNode: 'rdf-components/translate-procedure-cmumps2fhir'
            }).then(function(network) {

                return new Promise(function(done, fail) {

                    var repeaterNode = network.processes.repeaterNode.component;
                    var patientHashNode = network.processes.patientHashNode.component;
                    var translatorNode = network.processes.translatorNode.component;

                    network.graph.addEdge('repeaterNode', 'out', 'patientHashNode', 'patient_json');

                    network.graph.addEdge('cmumpsFileNode', 'out', 'translatorNode', 'cmumps_file');
                    network.graph.addEdge('fhirFileNode', 'out', 'translatorNode', 'fhir_file');
                    network.graph.addEdge('patientHashNode', 'output', 'translatorNode', 'input');

                    test.onOutPortData(translatorNode, 'output', done);
                    test.onOutPortData(translatorNode, 'error', fail);

                    var testFile = __dirname + '/data/cmumps-patient7.jsonld';
                    var data = fs.readFileSync(testFile);
                    var parsedData = JSON.parse(data); // readfile gives us a json object, so parse it

                    network.graph.addInitial(parsedData, 'repeaterNode', 'in');
                    network.graph.addInitial('', 'cmumpsFileNode', 'in');
                    network.graph.addInitial('', 'fhirFileNode', 'in');

                }).then(function(done) {
                    done.should.exist;
                    done.should.not.be.empty;
                    done.should.be.an('object');

                    done.should.have.all.keys('vnid','data','groupLm','lm','stale','error');
                    done.vnid.should.equal('Procedure:Procedure-1074046');
                    done.data.should.be.an('object');
                    done.data.should.include.keys('resourceType', 'identifier', 'subject', 'status',
                                                     'category', 'code', 'performedDateTime', 'encounter');
                    done.data.resourceType.should.equal('Procedure');
                    expect(done.error).to.be.undefined;
                    expect(done.stale).to.be.undefined;
                    done.groupLm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                    done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                }, function(fail) {
                    console.error('fail: ',fail);
                    throw Error(fail);
                });
           });
       });
   });
});

