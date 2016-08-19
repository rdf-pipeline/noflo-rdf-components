// cmumps2fhir-prescriptions-mocha.js

var chai = require('chai');

var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var _ = require('underscore');
var fs = require('fs');

var factory = require('../components/cmumps2fhir-prescriptions');
var logger = require('../src/logger');
var test = require('./common-test');

var testFile = __dirname + '/../node_modules/translators/data/fake_cmumps/patient-7/cmumps-patient7.jsonld';

describe('cmumpsfhir-prescriptions', function() {
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
                /Cmumps2fhir prescriptions component requires data to translate!/);
        });

        it('should return undefined if data is empty', function() {
            var node = test.createComponent(factory);
            sinon.stub(logger, 'warn');
            expect(factory.updater.call(node.vni(''), {})).to.be.undefined;
            logger.warn.restore();
        });

        it('should convert patient prescriptions to fhir', function() {
            var node = test.createComponent(factory);
            var data = fs.readFileSync(testFile);
            var parsedData = JSON.parse(data); // readfile gives us a json object, so parse it
            var translation = factory.updater.call(node.vni(''),parsedData);

            translation.should.not.be.empty;
            translation.should.be.an('array');
            translation.should.have.length(6);
            translation[0].should.include.keys('resourceType','identifier','status','patient',
                                               'quantity','dispenser','dosageInstruction');
            translation[0].resourceType.should.equal('MedicationDispense');
        });

        it('should write data to the specified intermediate files', function() {
            var node = test.createComponent(factory);
            var data = fs.readFileSync(testFile);
            var parsedData = JSON.parse(data); // readfile gives us a json object, so parse it
            var cmumpsFile='/tmp/cmumpsPrescriptions.out';
            var fhirFile='/tmp/fhirPrescriptions.out';

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
       
       it('should convert patient prescriptions to fhir in a noflo network', function() {
           this.timeout(3000);
           return test.createNetwork(
                { cmumpsFile: 'core/Repeat',
                  fhirFile: 'core/Repeat',
                  translator: 'rdf-components/cmumps2fhir-prescriptions'
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
                    done.data.should.be.an('array');
                    done.data.should.have.length(6);
                    done.data[0].should.include.keys('resourceType','identifier','status','patient',
                                                     'quantity','dispenser','dosageInstruction');
                    done.data[0].resourceType.should.equal('MedicationDispense');
                    expect(done.error).to.be.undefined;
                    expect(done.stale).to.be.undefined;
                    done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                    done.componentName.should.equal('rdf-components/cmumps2fhir-prescriptions');
                    expect(done.graphUri).to.be.undefined;
                });
           });
       });
   });
});


