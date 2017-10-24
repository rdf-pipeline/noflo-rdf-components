// translate-demographics-chcs2fhir-mocha.js

var chai = require('chai');

var expect = chai.expect;
var should = chai.should();

var _ = require('underscore');
var fs = require('fs');

var factory = require('../components/translate-demographics-chcs2fhir');
var logger = require('../src/logger');
var stateFactory = require('../src/create-state');
var test = require('./common-test');

var translator = require('translators').demographics;

var testFile = __dirname + '/data/chcs-patient7.jsonld';

describe('translate-demographics-chcs2fhir', function() {

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
            expect(factory.updater.bind(node.vni(''), undefined)).to.throw(Error,
                /No patient demographics data to translate!/);
        });

        it('should return empty object if input data is empty', function() {
            var node = test.createComponent(factory);
            expect(factory.updater.call(node.vni(''), {})).to.be.empty;
        });

        it('should convert patient demographics to fhir', function() {
            var node = test.createComponent(factory);
            var data = fs.readFileSync(testFile);
            var parsedData = JSON.parse(data); // readfile gives us a json object, so parse it
            var demographics = translator.extractDemographics(parsedData);
            var translation = factory.updater.call(node.vni(''), demographics);
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
            var demographics = translator.extractDemographics(parsedData);

            var chcsFile='/tmp/chcsDemographics.out';
            var fhirFile='/tmp/fhirDemographics.out';
            test.rmFile(chcsFile);
            test.rmFile(fhirFile);

            var translation = factory.updater.call(node.vni(''), demographics, chcsFile, fhirFile);
            translation.should.not.be.empty;

            // Verify the expected 2 files exist
            fs.accessSync(chcsFile, fs.F_OK);
            fs.accessSync(fhirFile, fs.F_OK);
        });
    });

    describe('functional behavior', function() {
       it('should convert patient demographics to fhir in a noflo network', function() {
           this.timeout(4000);
           return test.createNetwork(
               { funnel: 'rdf-components/funnel',
                 repeatData: 'rdf-components/repeat-data',
                 readContent: 'rdf-components/read-content',
                 patientHash: 'rdf-components/patient-hash',
                 chcsFile: 'core/Repeat',
                 fhirFile: 'core/Repeat',
                 translator: 'rdf-components/translate-demographics-chcs2fhir'
            }).then(function(network) {

                return new Promise(function(done, fail) {

                    var funnel = network.processes.funnel.component;
                    var repeatData = network.processes.repeatData.component; 
                    var translator = network.processes.translator.component;

                    // Funnel will set the patient ID metadata and clear old metadata
                    // repeatData will put the file name to read for data into the VNI data
                    // readContent will read patient data
                    network.graph.addEdge('funnel', 'output', 'repeatData', 'old_data');
                    network.graph.addEdge('repeatData', 'output', 'readContent', 'filename');
                    network.graph.addEdge('readContent', 'output', 'patientHash', 'patient_json');

                    network.graph.addEdge('chcsFile', 'out', 'translator', 'chcs_file');
                    network.graph.addEdge('fhirFile', 'out', 'translator', 'fhir_file');
                    network.graph.addEdge('patientHash', 'output', 'translator', 'input');

                    test.onOutPortData(translator, 'output', done);
                    test.onOutPortData(translator, 'error', fail);

                    var testFile = __dirname + '/data/chcs-patient7.jsonld';
                    var data = fs.readFileSync(testFile);
                    var parsedData = JSON.parse(data); // readfile gives us a json object, so parse it

                    logger.silence('warn');

                    network.graph.addInitial('patientId', 'funnel', 'metadata_key');
                    network.graph.addInitial('2-000007', 'funnel', 'input');

                    var testFile = __dirname + '/data/chcs-patient7.jsonld';
                    network.graph.addInitial(testFile, 'repeatData', 'new_data');

                    network.graph.addInitial('patientId', 'patientHash', 'metadata_key');

                    network.graph.addInitial('', 'chcsFile', 'in');
                    network.graph.addInitial('', 'fhirFile', 'in');

                }).then(function(done) {
                    logger.verbose('warn');

                    done.should.exist;
                    done.should.not.be.empty;
                    done.should.be.an('object');

                    done.should.include.keys('vnid','data','groupLm','lm','stale','error', 'componentName', 'graphUri');
                    done.vnid.should.equal('chcss:Patient-2:2-000007:2-000007');
                    done.data.should.be.an('object');
                    done.data.should.include.keys('resourceType', 'identifier', 'name', 'gender', 
                                                  'birthDate', 'address', 'maritalStatus');
                    done.data.resourceType.should.equal('Patient');
                    expect(done.error).to.be.undefined;
                    expect(done.stale).to.be.undefined;
                    done.groupLm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                    done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                    done.componentName.should.equal('rdf-components/translate-demographics-chcs2fhir');
                    done.graphUri.should.equal('urn:local:fhir:2-000007:rdf-components%2Ftranslate-demographics-chcs2fhir:Patient:2-000007');
    
                }, function(fail) {
                    console.error('fail: ',fail);
                    throw Error(fail);
                });
            });
       });

       it("should maintain state with a unique graphURI for each VNI with a distinct VNID", function() {
           this.timeout(5000);
           return test.createNetwork(
               { funnel: 'rdf-components/funnel',
                 repeatData: 'rdf-components/repeat-data',
                 readContent: 'rdf-components/read-content',
                 patientHash: 'rdf-components/patient-hash',
                 chcsFile: 'core/Repeat',
                 fhirFile: 'core/Repeat',
                 translator: 'rdf-components/translate-demographics-chcs2fhir'
           }).then(function(network) {

               var funnel = network.processes.funnel.component;
               var repeatData = network.processes.repeatData.component; 
               var translator = network.processes.translator.component;

               return new Promise(function(done, fail) {

                  // Funnel will set the patient ID metadata and clear old metadata
                  // repeatData will put the file name to read for data into the VNI data
                  // readContent will read patient data
                  network.graph.addEdge('funnel', 'output', 'repeatData', 'old_data');
                  network.graph.addEdge('repeatData', 'output', 'readContent', 'filename');
                  network.graph.addEdge('readContent', 'output', 'patientHash', 'patient_json');

                  network.graph.addEdge('chcsFile', 'out', 'translator', 'chcs_file');
                  network.graph.addEdge('fhirFile', 'out', 'translator', 'fhir_file');
                  network.graph.addEdge('patientHash', 'output', 'translator', 'input');

                  test.onOutPortData(translator, 'output', done);
                  test.onOutPortData(translator, 'error', fail);

                  logger.silence('warn');

                  network.graph.addInitial('patientId', 'funnel', 'metadata_key');
                  network.graph.addInitial('2-000007', 'funnel', 'input');

                  var testFile = __dirname + '/data/chcs-patient7.jsonld';
                  network.graph.addInitial(testFile, 'repeatData', 'new_data');

                  network.graph.addInitial('patientId', 'patientHash', 'metadata_key');

                  network.graph.addInitial('', 'chcsFile', 'in');
                  network.graph.addInitial('', 'fhirFile', 'in');

              }).then(function(done) {
                  done.should.be.an('object');
                  done.should.include.keys('vnid','data','groupLm','lm','stale','error', 
                                           'componentName', 'graphUri');
                  done.vnid.should.equal('chcss:Patient-2:2-000007:2-000007');
                  done.data.should.be.an('object');
                  done.data.should.include.keys('resourceType', 'identifier', 'name', 'gender', 
                                                'birthDate', 'address', 'maritalStatus');
                  done.componentName.should.equal('rdf-components/translate-demographics-chcs2fhir');
                  done.graphUri.should.equal('urn:local:fhir:2-000007:rdf-components%2Ftranslate-demographics-chcs2fhir:Patient:2-000007');

                  return new Promise(function(done2) {

                      test.onOutPortData(translator, 'output', done2);
                      network.graph.addInitial('patientId', 'funnel', 'metadata_key');
                      network.graph.addInitial('2-000008', 'funnel', 'input');

                      var testFile2 = __dirname + '/data/chcs-patient8.jsonld';
                      network.graph.addInitial(testFile2, 'repeatData', 'new_data');

                   }).then(function(done2) {
                      logger.verbose('warn');
                      done2.vnid.should.equal('chcss:Patient-2:2-000008:2-000008');
                      done2.should.include.keys('vnid','data','groupLm','lm','stale','error', 
                                                 'componentName', 'graphUri');
                      done2.componentName.should.equal('rdf-components/translate-demographics-chcs2fhir');
                      done2.graphUri.should.equal('urn:local:fhir:2-000008:rdf-components%2Ftranslate-demographics-chcs2fhir:Patient:2-000008');

                      done.vnid.should.equal('chcss:Patient-2:2-000007:2-000007');
                      done.componentName.should.equal('rdf-components/translate-demographics-chcs2fhir');
                      done.graphUri.should.equal('urn:local:fhir:2-000007:rdf-components%2Ftranslate-demographics-chcs2fhir:Patient:2-000007');
                   });

                 });
            });
        });
   });
});


