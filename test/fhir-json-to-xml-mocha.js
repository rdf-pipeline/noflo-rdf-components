// fhir-json-to-xml-mocha.js

var chai = require('chai');

var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var _ = require('underscore');
var fs = require('fs');

var test = require('./common-test');
var compFactory = require('../components/fhir-json-to-xml');

describe('fhir-json-to-xml', function() {

    it('should exist as a function', function() {
        compFactory.should.exist;
        compFactory.should.be.a('function');
    });

    it('should instantiate a noflo component', function() {
        var node = test.createComponent(compFactory);
        node.should.be.an('object');
        node.should.include.keys('nodeName', 'componentName', 'outPorts', 'inPorts', 'vni', 'vnis');
    });

    describe('#updater', function() {

        it('should throw an error if fhir data is undefined', function() {
            expect(compFactory.updater.bind(this, undefined)).to.throw(Error,
                /Expected fhir data and an output directory in which to write the xml files!/);
        });

        it('should throw an error if outdir is undefined', function() {
            expect(compFactory.updater.bind(this, {})).to.throw(Error,
                /Expected fhir data and an output directory in which to write the xml files!/);
        });

        it('should throw an error if outdir is empty', function() {
            expect(compFactory.updater.bind(this, {}, '')).to.throw(Error,
                /Expected fhir data and an output directory in which to write the xml files!/);
        });

        it('should convert a single fhir object to xml', function() {
            var data = fs.readFileSync('test/data/fhirInput.json');
            var parsedData = JSON.parse(data);

            var xmlFiles = compFactory.updater(parsedData,'/tmp/');

            xmlFiles.should.not.be.empty;
            xmlFiles.should.be.an('array');
            xmlFiles.should.have.length(1);
            
            var buf = fs.readFileSync(xmlFiles[0]);
            var xmlData = buf.toString();
            xmlData.should.contain('Patient');
            xmlData.should.contain('identifier');
            xmlData.should.contain('coding');
            xmlData.should.contain('name');
            xmlData.should.contain('family');
            xmlData.should.contain('gender');
            xmlData.should.contain('birthDate');
            xmlData.should.contain('address');
            xmlData.should.contain('maritalStatus');
        });

        it('should convert multiple fhir objects to xml', function() {
            var data = fs.readFileSync('test/data/fhir-prescripts.json');
            var parsedData = JSON.parse(data);

            var xmlFiles = compFactory.updater(parsedData,'/tmp/');

            xmlFiles.should.not.be.empty;
            xmlFiles.should.be.an('array');
            xmlFiles.should.have.length(6);

            xmlFiles.forEach( function(xmlFile) { 
                var buf = fs.readFileSync(xmlFile);
                var xmlData = buf.toString();
                xmlData.should.contain('MedicationDispense');
                xmlData.should.contain('patient');
                xmlData.should.contain('dispenser');
                xmlData.should.contain('authorizingPrescription');
                xmlData.should.contain('quantity');
                xmlData.should.contain('dosageInstruction');
            });
        });
            
    });
});

