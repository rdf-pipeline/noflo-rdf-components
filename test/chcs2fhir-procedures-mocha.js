// chcs2fhir-procedures-mocha.js

var chai = require('chai');

var expect = chai.expect;
var should = chai.should();

var _ = require('underscore');
var fs = require('fs');

var factory = require('../components/chcs2fhir-procedures');
var logger = require('../src/logger');
var test = require('./common-test');

var testFile = __dirname + '/../node_modules/translators/data/fake_chcs/patient-7/chcs-patient7.jsonld';

describe('chcs2fhir-procedures', function() {
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
                /Chcs2fhir procedures component requires data to translate!/);
        });

        it('should return undefined if data is empty', function() {
            var node = test.createComponent(factory);
            logger.silence('warn');
            expect(factory.updater.call(node.vni(''), {})).to.be.undefined;
            logger.verbose('warn');
        });

        it('should convert patient procedures to fhir', function() {
            var node = test.createComponent(factory);
            var data = fs.readFileSync(testFile);
            var parsedData = JSON.parse(data); // readfile gives us a json object, so parse it
            var translation = factory.updater.call(node.vni(''), parsedData);

            translation.should.not.be.empty;
            translation.should.be.an('array');
            translation.should.have.length(1);
            translation[0].should.include.keys('resourceType', 'identifier', 'subject', 'status',
                                               'category', 'code', 'performedDateTime', 'encounter');
            translation[0].resourceType.should.equal('Procedure');
        });

        it('should write data to the specified intermediate files', function() {
            var node = test.createComponent(factory);
            var data = fs.readFileSync(testFile);
            var parsedData = JSON.parse(data); // readfile gives us a json object, so parse it
            var chcsFile='/tmp/chcsProcedures.out';
            var fhirFile='/tmp/fhirProcedures.out';

            test.rmFile(chcsFile);
            test.rmFile(fhirFile);

            var translation = factory.updater.call(node.vni(''), parsedData, chcsFile, fhirFile);
            translation.should.not.be.empty;

            // Verify the expected 2 files exist
            fs.accessSync(chcsFile, fs.F_OK);
            fs.accessSync(fhirFile, fs.F_OK);
        });
    });

    describe('functional behavior', function() {
       it('should convert patient procedures to fhir in a noflo network', function() {
           this.timeout(3000);
           return test.createNetwork(
                { chcsFile: 'core/Repeat',
                  fhirFile: 'core/Repeat',
                  translator: 'rdf-components/chcs2fhir-procedures'
            }).then(function(network) {

                return new Promise(function(done, fail) {

                    var chcsFile = network.processes.chcsFile.component;
                    var fhirFile = network.processes.fhirFile.component;
                    var translator = network.processes.translator.component;

                    test.onOutPortData(translator, 'output', done);
                    test.onOutPortData(translator, 'error', fail);

                    network.graph.addEdge('chcsFile', 'out', 'translator', 'chcs_file');
                    network.graph.addEdge('fhirFile', 'out', 'translator', 'fhir_file');

                    var data = fs.readFileSync(testFile, 'utf-8');
                    network.graph.addInitial(data, 'translator', 'data');
                    network.graph.addInitial('/tmp/patient-7-procedures-chcs.jsonld', 'chcsFile', 'in');
                    network.graph.addInitial('/tmp/patient-7-procedures-fhir.jsonld', 'fhirFile', 'in');

                }).then(function(done) {
                    done.should.exist;
                    done.should.not.be.empty;
                    done.should.be.an('object');

                    done.should.have.all.keys('vnid','data','groupLm','lm',
                                              'stale','error','componentName', 'graphUri');
                    done.vnid.should.equal('');
                    done.data.should.be.an('array');
                    done.data.should.have.length(1);
                    done.data[0].should.include.keys('resourceType', 'identifier', 'subject', 'status',
                                                     'category', 'code', 'performedDateTime', 'encounter');
                    done.data[0].resourceType.should.equal('Procedure');
                    expect(done.error).to.be.undefined;
                    expect(done.stale).to.be.undefined;
                    done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                    done.componentName.should.equal('rdf-components/chcs2fhir-procedures');
                    done.graphUri.should.equal('urn:local:fhir::rdf-components%2Fchcs2fhir-procedures:Procedure:Procedure-1074046');
                });
           });
       });
   });
});

