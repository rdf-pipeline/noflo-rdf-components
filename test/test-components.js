var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var _ = require('underscore');

var fhirToXml = require('../components/fhir-to-xml');
var xmlToRdf = require('../components/fhir-xml-to-rdf');
var patientLoader = require('../components/patient-loader');

describe('components', function() {

    it("fhirToXml should exist as an object", function() {
        fhirToXml.should.exist;
        fhirToXml.should.be.an('object');
    });

    it("fhir-xml-to-rdf should exist as an object", function() {
        xmlToRdf.should.exist;
        xmlToRdf.should.be.an('object');
    });

    it("patient-loader should exist as an object", function() {
        patientLoader.should.exist;
        patientLoader.should.be.an('object');
    });
});

