// cmumps2fhir-demographics-mocha.js

var chai = require('chai');

var expect = chai.expect;
var should = chai.should();

var _ = require('underscore');
var fs = require('fs');

var factory = require('../components/cmumps2fhir-demographics');
var logger = require('../src/logger');
var test = require('./common-test');

var testFile = __dirname + '/data/cmumps-patient7.jsonld';

describe('cmumps2fhir-demographics', function() {

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
            expect(factory.updater.bind(this, undefined)).to.throw(Error,
                /Cmumps2fhir demographics component requires data to translate!/);
        });

        it('should return undefined if data is empty', function() {
            var node = test.createComponent(factory);
            logger.silence('warn');
            expect(factory.updater.call(node.vni(''), {})).to.be.undefined;
            logger.verbose('warn');
        });

        it('should convert patient demographics to fhir', function() {
            var node = test.createComponent(factory);
            var data = fs.readFileSync(testFile);
            var parsedData = JSON.parse(data); // readfile gives us a json object, so parse it
            var translation = factory.updater.call(node.vni(''), parsedData);
            translation.should.not.be.empty;
            translation.should.include.keys('resourceType', 'identifier', 'name', 'gender', 
                                            'birthDate', 'address', 'maritalStatus');
            translation.resourceType.should.equal('Patient');
        });

        it('should write data to the specified intermediate files', function() {
            var node = test.createComponent(factory);
            var data = fs.readFileSync(testFile);
            var parsedData = JSON.parse(data); // readfile gives us a json object, so parse it
            var cmumpsFile='/tmp/cmumpsDemographics.out';
            var fhirFile='/tmp/fhirDemographics.out';

            test.rmFile(cmumpsFile);
            test.rmFile(fhirFile);

            var translation = factory.updater.call(node.vni(''), parsedData, cmumpsFile, fhirFile);
            translation.should.not.be.empty;

            // Verify the expected 2 files exist
            fs.accessSync(cmumpsFile, fs.F_OK);
            fs.accessSync(fhirFile, fs.F_OK);
        });
    });

    describe('functional behavior', function() {
       it('should convert patient demographics to fhir in a noflo network', function() {
           this.timeout(4000);
           return test.createNetwork(
                { cmumpsFile: 'core/Repeat',
                  fhirFile: 'core/Repeat',
                  translator: 'rdf-components/cmumps2fhir-demographics'
            }).then(function(network) {

                return new Promise(function(done, fail) {

                    var cmumpsFile = network.processes.cmumpsFile.component;
                    var fhirFile = network.processes.fhirFile.component;
                    var translator = network.processes.translator.component;

                    test.onOutPortData(translator, 'output', done);
                    test.onOutPortData(translator, 'error', fail);

                    network.graph.addEdge('cmumpsFile', 'out', 'translator', 'cmumps_file');
                    network.graph.addEdge('fhirFile', 'out', 'translator', 'fhir_file');

		    var data = fs.readFileSync(testFile, 'utf-8');
                    network.graph.addInitial(data, 'translator', 'data');
                    network.graph.addInitial('', 'cmumpsFile', 'in');
                    network.graph.addInitial('', 'fhirFile', 'in');

                }).then(function(done) {
                    done.should.exist;
                    done.should.not.be.empty;
                    done.should.be.an('object');

                    done.should.have.all.keys('vnid','data','groupLm','lm',
                                              'stale','error', 'componentName', 'graphUri');
                    done.vnid.should.equal('');
                    done.data.should.be.an('object');
                    done.data.should.include.keys('resourceType', 'identifier', 'name', 'gender', 
                                                  'birthDate', 'address','maritalStatus');
                    done.data.resourceType.should.equal('Patient');
                    expect(done.error).to.be.undefined;
                    expect(done.stale).to.be.undefined;
                    done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                    done.componentName.should.equal('rdf-components/cmumps2fhir-demographics');
                    done.graphUri.should.equal('urn:local:fhir::rdf-components%2Fcmumps2fhir-demographics:Patient:2-000007');
                });
            });
       });

   });
});


