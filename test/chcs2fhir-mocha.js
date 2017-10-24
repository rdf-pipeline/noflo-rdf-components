// chcs2fhir-mocha.js

var chai = require('chai');

var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var _ = require('underscore');
var fs = require('fs');

var componentFactory = require('../src/noflo-component-factory');
var stateFactory = require('../src/create-state');
var vniManager = require('../src/vni-manager');

var chcs2fhir = require('../components/chcs2fhir');
var logger = require('../src/logger');
var test = require('./common-test');

var testFile = '../node_modules/translators/data/fake_chcs/patient-7/chcs-patient7.jsonld';

describe('chcs2fhir', function() {

    it('should exist as a function', function() {
        chcs2fhir.should.exist;
        chcs2fhir.should.be.a('function');
    });

    it('should throw an error if input data is undefined', function() {
        expect(chcs2fhir).to.throw(Error,
            /Chcs2fhir requires data to translate!/);
    });

    it('should return empty object if input data is empty', function() {
        logger.silence('warn');
        var node = test.createComponent(componentFactory({}, vniManager));
        expect(chcs2fhir.call(node.vni(), {})).to.be.empty;
        logger.verbose('warn');
    });

    it('should extract data using the specified extractor function', function() {
        var node = test.createComponent(componentFactory({}, vniManager));
        var testData = '{"@context": "https://github.com/chcs-pipeline?token=ACA8nzdawL"}';
        var extractor = function(data) {
            return data['@context'].match(/^(https\:\/\/[A-Za-z0-9\/\-\.]+).*/)[1];
	}

        var results = chcs2fhir.call(node.vni(), testData, extractor);
        results.should.equal('https://github.com/chcs-pipeline');
    });

    it('should gracefully handle a failed extraction', function() {

        var warned = false;
        sinon.stub(logger, 'warn').callsFake(function(message) { 
             // should get a warning like "No patient chcs data found".
             warned = true;
        });

        var node = test.createComponent(componentFactory({}, vniManager));
        var testData = '{"@context": "A different beat"}';
        var extractor = function(data) {
            return;  // return nothing
	}

        var results = chcs2fhir.call(node.vni(), testData, extractor);
        logger.warn.restore();

        expect(results).to.be.undefined;
        warned.should.be.true;
    });

    it('should translate data using the specified translator function', function() {
        var node = test.createComponent(componentFactory({}, vniManager));
        var testData = '{"@context": "https://github.com/chcs-pipeline"}';
        var translator = function(data) {
            return data['@context'].replace('chcs', 'fhir');
	}
        var results = chcs2fhir.call(node.vni(), testData, undefined, translator);
        results.should.equal('https://github.com/fhir-pipeline');
    });

    it('should gracefully handle a failed translation', function() {

        var warned = false;
        sinon.stub(logger, 'warn').callsFake(function(message) { 
             // should get a warning like "No patient chcs data found".
             warned = true;
        });

        var node = test.createComponent(componentFactory({}, vniManager));
        var testData = '{"@context": "A different beat"}';
        var translator = function(data) {
            return;  // return nothing
	}

        var results = chcs2fhir.call(node.vni(), testData, undefined, translator);
        logger.warn.restore();

        expect(results).to.be.undefined;
        warned.should.be.true;
    });

    it('should extract data and translate it using the specified extractor and translator', function() {
        var node = test.createComponent(componentFactory({}, vniManager));
        var testData = '{"@context": "https://github.com/chcs-pipeline?token=ACA8nzdawL"}';
        var extractor = function(data) {
            return {'@context': data['@context'].match(/^(https\:\/\/[A-Za-z0-9\/\-\.]+).*/)[1]};
	}
        var translator = function(data) {
            return data['@context'].replace('chcs', 'fhir');
	}

        var results = chcs2fhir.call(node.vni(), testData, extractor, translator);
        results.should.equal('https://github.com/fhir-pipeline');
    });

    it('should write data to the specified intermediate files', function() {
        var node = test.createComponent(componentFactory({}, vniManager));
        var testData = '{"@context": "https://github.com/chcs-pipeline?token=ACA8nzdawL"}';
        var extractor = function(data) {
            return {'@context': data['@context'].match(/^(https\:\/\/[A-Za-z0-9\/\-\.]+).*/)[1]};
	}
        var translator = function(data) {
            return data['@context'].replace('chcs', 'fhir');
	}
        var chcsFile='/tmp/chcsExtract.out';
        var fhirFile='/tmp/fhirTranslation.out';

        logger.silence('info');
        var results = chcs2fhir.call(node.vni(), testData, extractor, translator, chcsFile, fhirFile);
        logger.verbose('dir');

        results.should.equal('https://github.com/fhir-pipeline');

        // Verify the expected 2 files exist
        fs.accessSync(chcsFile, fs.F_OK);
        fs.accessSync(fhirFile, fs.F_OK);
    });

    it("should generate a graph URI with patient id and resource type metadata if they are available", function() {

        // get simple test patient data
        var testFile = __dirname + '/data/chcs-patient7.jsonld';
        var data = fs.readFileSync(testFile);
        var parsedData = JSON.parse(data); 

        var node = test.createComponent(componentFactory({}, vniManager));

        // Create a VNI for this patient and put patientId and resourceType metadata on it
        var patientId = "PatientId-2468";
        var vni = node.vni(patientId);
        vni.nodeInstance = {"componentName": "rdf/procedure-translator"};
 
        var outState = stateFactory(patientId);
        stateFactory.addMetadata(outState, 
                                 {"patientId": patientId,
                                  "resourceType": "Procedure"});
        vni.outputState(outState);

        var translator = require('translators').procedures;
        var results = chcs2fhir.call(vni, 
                                       parsedData, 
                                       translator.extractProcedures,
                                       translator.translateProceduresFhir);

        results.should.be.an('array');
        results[0].should.include.keys('resourceType', 'id', 'subject', 'status', 'category',
                                       'code', 'performer', 'performedDateTime', 'encounter');

        vni.outputState().graphUri.should.equal('urn:local:fhir:PatientId-2468:rdf%2Fprocedure-translator:Procedure:Procedure-1074046');

    });

    it("should generate a graph URI with patient id metadata if it is available", function() {

        // get simple test patient data
        var testFile = __dirname + '/data/chcs-patient7.jsonld';
        var data = fs.readFileSync(testFile);
        var parsedData = JSON.parse(data); 

        var node = test.createComponent(componentFactory({}, vniManager));

        // Create a VNI for this patient and put patientId and resourceType metadata on it
        var patientId = "PatientId-8642";
        var vni = node.vni(patientId);
        vni.nodeInstance = {"componentName": "rdf/procedure-translator"};
 
        var outState = stateFactory(patientId);
        stateFactory.addMetadata(outState, 
                                 {"patientId": patientId});
        vni.outputState(outState);

        var translator = require('translators').procedures;
        var results = chcs2fhir.call(vni, 
                                       parsedData, 
                                       translator.extractProcedures,
                                       translator.translateProceduresFhir);
        results.should.be.an('array');
        results[0].should.include.keys('resourceType', 'id', 'subject', 'status', 'category',
                                       'code', 'performer', 'performedDateTime', 'encounter');

        vni.outputState().graphUri.should.equal('urn:local:fhir:PatientId-8642:rdf%2Fprocedure-translator:Procedure:Procedure-1074046');
    });

    it("should keep the same graph id for translator if it does not change", function() {

        // get simple test patient data
        var testFile = __dirname + '/data/chcs-patient7.jsonld';
        var data = fs.readFileSync(testFile);
        var parsedData = JSON.parse(data); 

        // extract and translate the patient demographics to fhir. 
        var node = test.createComponent(componentFactory({}, vniManager));
        var vni = node.vni('');
        vni.nodeInstance = {"componentName": "rdf/test-translator"};

        var translator = require('translators').demographics;
        var results = chcs2fhir.call(vni, 
                                       parsedData, 
                                       translator.extractDemographics,
                                       translator.translateDemographicsFhir);

        // Verify initial results
        results.should.be.an('array');
        results[0].should.include.keys('resourceType', 'identifier', 'name', 'gender',
                                    'birthDate', 'address', 'maritalStatus');
        results[0].maritalStatus.should.deep.equal({ coding: [{ system: 'http://hl7.org/fhir/marital-status',
                                                                code: 'D',
                                                                display: 'D' }],
                                                    text: 'D' });
        vni.outputState().graphUri.should.equal('urn:local:fhir::rdf%2Ftest-translator:Patient:2-000007');

        // Now call it again with updated marital status
        var patientData = parsedData['@graph'][0];
        patientData['marital_status-2'] = {id:'11-1', label: 'MARRIED'};
        var results2 = chcs2fhir.call(vni, 
                                        parsedData, 
                                        translator.extractDemographics,
                                        translator.translateDemographicsFhir);

        // Verify the update occured but graph URI is the same.
        results2[0].maritalStatus.should.deep.equal({ coding: [{ system: 'http://hl7.org/fhir/marital-status',
                                                                code: 'M',
                                                                display: 'M' } ],
                                                      text: 'M' });
        vni.outputState().graphUri.should.equal('urn:local:fhir::rdf%2Ftest-translator:Patient:2-000007');
    });

    it("should update to the most recent translator metadata when generating a graphUri", function() {

        // get simple test patient data
        var testFile = __dirname + '/data/chcs-patient7.jsonld';
        var data = fs.readFileSync(testFile);
        var parsedData = JSON.parse(data); 

        // extract and translate the patient demographics to fhir. 
        var node = test.createComponent(componentFactory({}, vniManager));

        var vni = node.vni('');
        vni.nodeInstance = {"componentName": "rdf/demographics-translator"};
 
        var demographicsTranslator = require('translators').demographics;
        var results = chcs2fhir.call(vni, 
                                       parsedData, 
                                       demographicsTranslator.extractDemographics,
                                       demographicsTranslator.translateDemographicsFhir);

        // Verify initial results
        results.should.be.an('array');
        results[0].should.include.keys('resourceType', 'identifier', 'name', 'gender',
                                    'birthDate', 'address', 'maritalStatus');
        vni.outputState().graphUri.should.equal('urn:local:fhir::rdf%2Fdemographics-translator:Patient:2-000007');

        // Now we'll do procedure translation
        vni.nodeInstance = {"componentName": "rdf/procedure-translator"};
        var proceduresTranslator = require('translators').procedures;
        var results2 = chcs2fhir.call(vni, 
                                       parsedData, 
                                       proceduresTranslator.extractProcedures,
                                       proceduresTranslator.translateProceduresFhir);

        // Verify results are for procedure and we got an array of both translator graph URIs
        results2.should.be.an('array');
        results2[0].should.include.keys('resourceType', 'id', 'subject', 'status', 'category',
                                        'code', 'performer', 'performedDateTime', 'encounter');
        vni.outputState().graphUri.should.equal('urn:local:fhir::rdf%2Fprocedure-translator:Procedure:Procedure-1074046');

    });

});
