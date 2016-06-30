// cmumps2fhir-mocha.js

var chai = require('chai');

var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var _ = require('underscore');
var fs = require('fs');

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
            expect(cmumps2fhir({})).to.be.empty;
            logger.warn.restore();
    });

    it('should extract data using the specified extractor function', function() {
        var testData = '{"@context": "https://github.com/cmumps-pipeline?token=ACA8nzdawL"}';
        var extractor = function(data) {
            return data['@context'].match(/^(https\:\/\/[A-Za-z0-9\/\-\.]+).*/)[1];
	}
        var results = cmumps2fhir(testData, extractor);
        results.should.equal('https://github.com/cmumps-pipeline');
    });

    it('should gracefully handle a failed extraction', function() {

        var warned = false;
        sinon.stub(logger, 'warn', function(message) { 
             // should get a warning like "No patient cmumps data found".
             warned = true;
        });

        var testData = '{"@context": "A different beat"}';
        var extractor = function(data) {
            return;  // return nothing
	}

        var results = cmumps2fhir(testData, extractor);
        logger.warn.restore();

        expect(results).to.be.undefined;
        warned.should.be.true;
    });

    it('should translate data using the specified translator function', function() {
        var testData = '{"@context": "https://github.com/cmumps-pipeline"}';
        var translator = function(data) {
            return data['@context'].replace('cmumps', 'fhir');
	}
        var results = cmumps2fhir(testData, undefined, translator);
        results.should.equal('https://github.com/fhir-pipeline');
    });

    it('should gracefully handle a failed translation', function() {

        var warned = false;
        sinon.stub(logger, 'warn', function(message) { 
             // should get a warning like "No patient cmumps data found".
             warned = true;
        });

        var testData = '{"@context": "A different beat"}';
        var translator = function(data) {
            return;  // return nothing
	}

        var results = cmumps2fhir(testData, undefined, translator);
        logger.warn.restore();

        expect(results).to.be.undefined;
        warned.should.be.true;
    });

    it('should extract data and translate it using the specified extractor and translator', function() {

        var testData = '{"@context": "https://github.com/cmumps-pipeline?token=ACA8nzdawL"}';
        var extractor = function(data) {
            return {'@context': data['@context'].match(/^(https\:\/\/[A-Za-z0-9\/\-\.]+).*/)[1]};
	}
        var translator = function(data) {
            return data['@context'].replace('cmumps', 'fhir');
	}

        var results = cmumps2fhir(testData, extractor, translator);
        results.should.equal('https://github.com/fhir-pipeline');
    });

    it('should write data to the specified intermediate files', function() {

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
        var results = cmumps2fhir(testData, extractor, translator, cmumpsFile, fhirFile);
        logger.info.restore();

        results.should.equal('https://github.com/fhir-pipeline');

        // Verify the expected 2 files exist
        fs.accessSync(cmumpsFile, fs.F_OK);
        fs.accessSync(fhirFile, fs.F_OK);
    });
});


