// translate-demographics-cmumps2fhir-mocha.js

var chai = require('chai');

var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var _ = require('underscore');
var fs = require('fs');

var extractor = require('translators').cmumps;

var factory = require('../components/translate-demographics-cmumps2fhir');
var logger = require('../src/logger');
var test = require('./common-test');

var testFile = __dirname + '/data/cmumps-patient7.jsonld';

describe('translate-demographics-cmumps2fhir', function() {

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

        it('should throw an error if input data is undefined', function() {
            var node = test.createComponent(factory);
            expect(factory.updater.bind(node.vni(), undefined)).to.throw(Error,
                /No patient demographics data to translate!/);
        });

        it('should return empty object if input data is empty', function() {
            var node = test.createComponent(factory);
            sinon.stub(logger, 'warn');
            expect(factory.updater.call(node.vni(), {})).to.be.empty;
            logger.warn.restore();
        });

        it('should convert patient demographics to fhir', function() {
            var node = test.createComponent(factory);
            var data = fs.readFileSync(testFile);
            var parsedData = JSON.parse(data); // readfile gives us a json object, so parse it
            var demographics = extractor.extractDemographics(parsedData);
            var translation = factory.updater.call(node.vni(), demographics);
            translation.should.not.be.empty;
            translation.should.be.an('array');
            translation.should.have.length(1);
            var fhirTranslation = translation[0];
            fhirTranslation.should.include.keys('resourceType', 'identifier', 'name', 'gender', 
                                               'birthDate', 'address','maritalStatus', 'contact');
            fhirTranslation.resourceType.should.equal('Patient');
        });

        it('should write data to the specified intermediate files', function() {
            var node = test.createComponent(factory);
            var data = fs.readFileSync(testFile);
            var parsedData = JSON.parse(data); // readfile gives us a json object, so parse it
            var demographics = extractor.extractDemographics(parsedData);

            var cmumpsFile='/tmp/cmumpsDemographics.out';
            var fhirFile='/tmp/fhirDemographics.out';
            test.rmFile(cmumpsFile);
            test.rmFile(fhirFile);

            var translation = factory.updater.call(node.vni(), demographics, cmumpsFile, fhirFile);
            translation.should.not.be.empty;

            // Verify the expected 2 files exist
            fs.accessSync(cmumpsFile, fs.F_OK);
            fs.accessSync(fhirFile, fs.F_OK);
        });
    });

    describe('functional behavior', function() {
       it('should convert patient demographics to fhir in a noflo network', function() {
           this.timeout(2500);
           return test.createNetwork(
                { repeaterNode: 'core/Repeat',
                  patientHashNode: 'rdf-components/patient-hash',
                  cmumpsFileNode: 'core/Repeat',
                  fhirFileNode: 'core/Repeat',
                  translatorNode: 'rdf-components/translate-demographics-cmumps2fhir'
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

                    done.should.have.all.keys('vnid','data','groupLm','lm','stale','error', 'graphUri');
                    done.vnid.should.equal('cmumpss:Patient-2:2-000007');
                    done.data.should.be.an('object');
                    done.data.should.include.keys('resourceType', 'identifier', 'name', 'gender', 
                                                  'birthDate', 'address', 'maritalStatus');
                    done.data.resourceType.should.equal('Patient');
                    expect(done.error).to.be.undefined;
                    expect(done.stale).to.be.undefined;
                    done.groupLm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                    done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                    done.graphUri.startsWith('urn:local:rdf-components%2Ftranslate-demographics-cmumps2fhir').should.be.true;
    
                }, function(fail) {
                    console.error('fail: ',fail);
                    throw Error(fail);
                });
            });
       });

       it("should maintain state with unique graphURIs for each VNI with a distinct VNID", function() {
           this.timeout(3000);
           return test.createNetwork(
               { repeaterNode: 'core/Repeat',
                 patientHashNode: 'rdf-components/patient-hash',
                 cmumpsFileNode: 'core/Repeat',
                 fhirFileNode: 'core/Repeat',
                 translatorNode: 'rdf-components/translate-demographics-cmumps2fhir'
           }).then(function(network) {

               var repeaterNode = network.processes.repeaterNode.component;
               var patientHashNode = network.processes.patientHashNode.component;
               var translatorNode = network.processes.translatorNode.component;

               return new Promise(function(done, fail) {

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
                  done.should.be.an('object');
                  done.should.have.all.keys('vnid','data','groupLm','lm','stale','error', 'graphUri');
                  done.vnid.should.equal('cmumpss:Patient-2:2-000007');
                  done.data.should.be.an('object');
                  done.data.should.include.keys('resourceType', 'identifier', 'name', 'gender', 
                                                'birthDate', 'address', 'maritalStatus');
                  done.graphUri.should.equal('urn:local:rdf-components%2Ftranslate-demographics-cmumps2fhir:Patient:2-000007');

                  return new Promise(function(done2) {
                      var testFile = __dirname + '/data/cmumps-patient8.jsonld';
                      var data = fs.readFileSync(testFile);
                      var parsedData2 = JSON.parse(data); 

                      test.onOutPortData(translatorNode, 'output', done2);
                      network.graph.addInitial(parsedData2, 'repeaterNode', 'in');

                   }).then(function(done2) {

                      done2.vnid.should.equal('cmumpss:Patient-2:2-000008');
                      done2.should.have.all.keys('vnid','data','groupLm','lm','stale','error', 'graphUri');
                      done2.graphUri.should.equal('urn:local:rdf-components%2Ftranslate-demographics-cmumps2fhir:Patient:2-000008');

                      done.vnid.should.equal('cmumpss:Patient-2:2-000007');
                      done.graphUri.should.equal('urn:local:rdf-components%2Ftranslate-demographics-cmumps2fhir:Patient:2-000007');
                   });

                 });
            });
        });
   });
});


