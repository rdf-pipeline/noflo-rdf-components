// translate-diagnosis-cmumps2fhir-mocha.js

var chai = require('chai');

var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var _ = require('underscore');
var fs = require('fs');

var extractor = require('translators').cmumps;

var factory = require('../components/translate-diagnosis-cmumps2fhir');
var logger = require('../src/logger');
var test = require('./common-test');

var testFile = __dirname + '/data/cmumps-patient7.jsonld';

describe('translate-diagnosis-cmumps2fhir', function() {

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
            var node = test.createComponent(factory);
            expect(factory.updater.bind(node.vni(''), undefined)).to.throw(Error,
                /No patient diagnosis data to translate!/);
        });

        it('should return undefined if data is empty', function() {
            var node = test.createComponent(factory);
            expect(factory.updater.call(node.vni(''), {})).to.be.undefined;
        });

        it('should convert a patient diagnosis to fhir', function() {
            var node = test.createComponent(factory);
            var data = fs.readFileSync(testFile);
            var parsedData = JSON.parse(data); // readfile gives us a json object, so parse it
            var diagnosis = extractor.extractDiagnoses(parsedData);

            var translation = factory.updater.call(node.vni(''), diagnosis);

            translation.should.not.be.empty;
            translation.should.be.an('array');
            translation.should.have.length(3);
            var fhirTranslation = translation[0];
            fhirTranslation.should.include.keys('resourceType','identifier','status','code',
                                                'subject', 'category', 'conclusion',
                                                'codedDiagnosis');
            fhirTranslation.resourceType.should.equal('DiagnosticReport');
        });

        it('should write data to the specified intermediate files', function() {
            var node = test.createComponent(factory);
            var data = fs.readFileSync(testFile);
            var parsedData = JSON.parse(data); // readfile gives us a json object, so parse it
            var diagnosis = extractor.extractDiagnoses(parsedData);

            var cmumpsFile='/tmp/cmumpsDiagnosis.out';
            var fhirFile='/tmp/fhirDiagnosis.out';
            test.rmFile(cmumpsFile);
            test.rmFile(fhirFile);

            var translation = factory.updater.call(node.vni(''), diagnosis, cmumpsFile, fhirFile);
            translation.should.not.be.empty;

            // Verify the expected 2 files exist
            fs.accessSync(cmumpsFile, fs.F_OK);
            fs.accessSync(fhirFile, fs.F_OK);
        });

    });

    describe('functional behavior', function() {
       
       it('should convert patient diagnosis to fhir in a noflo network', function() {
           this.timeout(4000);

           return test.createNetwork(
                { repeaterNode: 'core/Repeat',
                  patientHashNode: 'rdf-components/patient-hash',
                  cmumpsFileNode: 'core/Repeat',
                  fhirFileNode: 'core/Repeat',
                  translatorNode: 'rdf-components/translate-diagnosis-cmumps2fhir'
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

                    var data = fs.readFileSync(testFile);
                    var parsedData = JSON.parse(data); // readfile gives us a json object, so parse it

                    sinon.stub(logger, 'warn');
                    network.graph.addInitial(parsedData, 'repeaterNode', 'in');
                    network.graph.addInitial('', 'cmumpsFileNode', 'in');
                    network.graph.addInitial('', 'fhirFileNode', 'in');

                }).then(function(done) {
                    logger.warn.restore();
                    done.should.exist;
                    done.should.not.be.empty;
                    done.should.be.an('object');
                    done.should.include.keys('vnid','data','groupLm','lm','stale','error', 
                                             'componentName', 'graphUri');
                    done.vnid.should.equal('cmumpss:Kg_Patient_Diagnosis-100417:100417-4559064');
                    done.data.should.be.an('object');
                    done.data.should.include.keys('resourceType','identifier','status','code',
                                                  'subject', 'category', 'conclusion',
                                                  'codedDiagnosis');
                    done.data.resourceType.should.equal('DiagnosticReport');
                    expect(done.error).to.be.undefined;
                    expect(done.stale).to.be.undefined;
                    done.groupLm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                    done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                    done.componentName.should.equal('rdf-components/translate-diagnosis-cmumps2fhir');
                    done.patientId.should.equal('2-000007');
                    done.graphUri.startsWith('urn:local:rdf-components%2Ftranslate-diagnosis-cmumps2fhir').should.be.true;

                }, function(fail) {
                    logger.warn.restore();
                    console.error('fail: ',fail);
                    throw Error(fail);
                });
           });
       });
   });
});


