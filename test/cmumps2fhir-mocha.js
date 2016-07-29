// cmumps2fhir-mocha.js

var chai = require('chai');

var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var _ = require('underscore');
var fs = require('fs');

var componentFactory = require('../src/noflo-component-factory');
var vniManager = require('../src/vni-manager');

var extractor = require('translators').cmumps;
var translator = require('translators').demographics;

var cmumps2fhir = require('../components/cmumps2fhir');
var logger = require('../src/logger');
var test = require('./common-test');

var testFile = '../node_modules/translators/data/fake_cmumps/patient-7/cmumps-patient7.jsonld';

describe('cmumps2fhir', function() {

    it('should exist as a function', function() {
        cmumps2fhir.should.exist;
        cmumps2fhir.should.be.a('function');
    });

    it('should throw an error if input data is undefined', function() {
        expect(cmumps2fhir).to.throw(Error,
            /Cmumps2fhir requires data to translate!/);
    });

    it('should return empty object if input data is empty', function() {
        sinon.stub(logger, 'warn');
        var node = test.createComponent(componentFactory({}, vniManager));
        expect(cmumps2fhir.call(node.vni(), {})).to.be.empty;
        logger.warn.restore();
    });

    it('should extract data using the specified extractor function', function() {
        var node = test.createComponent(componentFactory({}, vniManager));
        var testData = '{"@context": "https://github.com/cmumps-pipeline?token=ACA8nzdawL"}';
        var extractor = function(data) {
            return data['@context'].match(/^(https\:\/\/[A-Za-z0-9\/\-\.]+).*/)[1];
	}

        var results = cmumps2fhir.call(node.vni(), testData, extractor);
        results.should.equal('https://github.com/cmumps-pipeline');
    });

    it('should gracefully handle a failed extraction', function() {

        var warned = false;
        sinon.stub(logger, 'warn', function(message) { 
             // should get a warning like "No patient cmumps data found".
             warned = true;
        });

        var node = test.createComponent(componentFactory({}, vniManager));
        var testData = '{"@context": "A different beat"}';
        var extractor = function(data) {
            return;  // return nothing
	}

        var results = cmumps2fhir.call(node.vni(), testData, extractor);
        logger.warn.restore();

        expect(results).to.be.undefined;
        warned.should.be.true;
    });

    it('should translate data using the specified translator function', function() {
        var node = test.createComponent(componentFactory({}, vniManager));
        var testData = '{"@context": "https://github.com/cmumps-pipeline"}';
        var translator = function(data) {
            return data['@context'].replace('cmumps', 'fhir');
	}
        var results = cmumps2fhir.call(node.vni(), testData, undefined, translator);
        results.should.equal('https://github.com/fhir-pipeline');
    });

    it('should gracefully handle a failed translation', function() {

        var warned = false;
        sinon.stub(logger, 'warn', function(message) { 
             // should get a warning like "No patient cmumps data found".
             warned = true;
        });

        var node = test.createComponent(componentFactory({}, vniManager));
        var testData = '{"@context": "A different beat"}';
        var translator = function(data) {
            return;  // return nothing
	}

        var results = cmumps2fhir.call(node.vni(), testData, undefined, translator);
        logger.warn.restore();

        expect(results).to.be.undefined;
        warned.should.be.true;
    });

    it('should extract data and translate it using the specified extractor and translator', function() {
        var node = test.createComponent(componentFactory({}, vniManager));
        var testData = '{"@context": "https://github.com/cmumps-pipeline?token=ACA8nzdawL"}';
        var extractor = function(data) {
            return {'@context': data['@context'].match(/^(https\:\/\/[A-Za-z0-9\/\-\.]+).*/)[1]};
	}
        var translator = function(data) {
            return data['@context'].replace('cmumps', 'fhir');
	}

        var results = cmumps2fhir.call(node.vni(), testData, extractor, translator);
        results.should.equal('https://github.com/fhir-pipeline');
    });

    it('should write data to the specified intermediate files', function() {
        var node = test.createComponent(componentFactory({}, vniManager));
        var testData = '{"@context": "https://github.com/cmumps-pipeline?token=ACA8nzdawL"}';
        var extractor = function(data) {
            return {'@context': data['@context'].match(/^(https\:\/\/[A-Za-z0-9\/\-\.]+).*/)[1]};
	}
        var translator = function(data) {
            return data['@context'].replace('cmumps', 'fhir');
	}
        var cmumpsFile='/tmp/cmumpsExtract.out';
        var fhirFile='/tmp/fhirTranslation.out';

        sinon.stub(logger, 'info');
        var results = cmumps2fhir.call(node.vni(), testData, extractor, translator, cmumpsFile, fhirFile);
        logger.info.restore();

        results.should.equal('https://github.com/fhir-pipeline');

        // Verify the expected 2 files exist
        fs.accessSync(cmumpsFile, fs.F_OK);
        fs.accessSync(fhirFile, fs.F_OK);
    });

    it("should keep the same graph id for translator if it does not change", function() {

        // get simple test patient data
        var testFile = __dirname + '/data/cmumps-patient7.jsonld';
        var data = fs.readFileSync(testFile);
        var parsedData = JSON.parse(data); 

        // extract and translate the patient demographics to fhir. 
        var node = test.createComponent(componentFactory({}, vniManager));
        var vni = node.vni('');
        vni.nodeInstance = {"componentName": "rdf/test-translator"};
        var results = cmumps2fhir.call(vni, 
                                       parsedData, 
                                       extractor.extractDemographics,
                                       translator.translateDemographicsFhir);

        // Verify initial results
        results.should.be.an('array');
        results[0].should.include.keys('resourceType', 'identifier', 'name', 'gender',
                                    'birthDate', 'address', 'maritalStatus');
        results[0].maritalStatus.should.deep.equal({ coding: [{ system: 'http://hl7.org/fhir/marital-status',
                                                                code: 'D',
                                                                display: 'D' }],
                                                    text: 'D' });
        vni.outputState().graphUri.should.equal('urn:local:rdf%2Ftest-translator:Patient:2-000007');

        // Now call it again with updated marital status
        var patientData = parsedData['@graph'][0];
        patientData['marital_status-2'] = {id:'11-1', label: 'MARRIED'};
        var results2 = cmumps2fhir.call(vni, 
                                        parsedData, 
                                        extractor.extractDemographics,
                                        translator.translateDemographicsFhir);

        // Verify the update occured but graph URI is the same.
        results2[0].maritalStatus.should.deep.equal({ coding: [{ system: 'http://hl7.org/fhir/marital-status',
                                                                code: 'M',
                                                                display: 'M' } ],
                                                      text: 'M' });
        vni.outputState().graphUri.should.equal('urn:local:rdf%2Ftest-translator:Patient:2-000007');
    });

    it("should make an array of graph id metadata if multiple ids for translator components", function() {

        // get simple test patient data
        var testFile = __dirname + '/data/cmumps-patient7.jsonld';
        var data = fs.readFileSync(testFile);
        var parsedData = JSON.parse(data); 

        // extract and translate the patient demographics to fhir. 
        var node = test.createComponent(componentFactory({}, vniManager));
        var vni = node.vni('');
        vni.nodeInstance = {"componentName": "rdf/demographics-translator"};
        var results = cmumps2fhir.call(vni, 
                                       parsedData, 
                                       extractor.extractDemographics,
                                       translator.translateDemographicsFhir);

        // Verify initial results
        results.should.be.an('array');
        results[0].should.include.keys('resourceType', 'identifier', 'name', 'gender',
                                    'birthDate', 'address', 'maritalStatus');
        vni.outputState().graphUri.should.equal('urn:local:rdf%2Fdemographics-translator:Patient:2-000007');

        // Now we'll do procedure translation
        vni.nodeInstance = {"componentName": "rdf/procedure-translator"};
        var results2 = cmumps2fhir.call(vni, 
                                       parsedData, 
                                       extractor.extractProcedures,
                                       translator.translateProceduresFhir);

        // Verify results are for procedure and we got an array of both translator graph URIs
        results2.should.be.an('array');
        results2[0].should.include.keys('type', 'label', 'description', 'comments', 'source',
                                        'status', 'dateReported', 'verified', 'provider');
        vni.outputState().graphUri.should.deep.equal(['urn:local:rdf%2Fdemographics-translator:Patient:2-000007',
     'urn:local:rdf%2Fprocedure-translator:Procedure:Procedure-1074046']);

    });

});


