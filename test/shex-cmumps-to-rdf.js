// shex-cmumps-to-rdf-mocha.js

var chai = require('chai');

var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

var _ = require('underscore');
var fs = require('fs');

var test = require('./common-test');
var compFactory = require('../components/shex-cmumps-to-rdf');

var testFile = __dirname + '/../node_modules/translators/data/fake_cmumps/patient-7/cmumps-patient7.jsonld';

describe('shex-cmumps-to-rdf', function() {

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

        it('should throw an error if no parameters', function() {
            expect(compFactory.updater.bind(this)).to.throw(Error, 
                /shex-cmumps-to-rdf component requires cmumps data to parse!/);
        }); 

        it('should throw an error if passed invalid JSON', function() {
            expect(compFactory.updater.bind(this, 'A bad JSON String')).to.throw(Error, 
                /shex-cmumps-to-rdf component is unable to parse input data: Unexpected token A/);
        }); 

        it('should throw an error if passed input data with no context', function() {
            var testData = '{"@graph": [{"type": "cmumpss:Patient-2",'+
                           '             "_id": "2-000007"}]}';
            expect(compFactory.updater.bind(this, testData)).to.throw(Error, 
                /shex-cmumps-to-rdf component expects @context and @graph specification on input data!/);
        }); 

        it('should throw an error if passed input data with no graph', function() {
            var testData = '{"@context": "https://hokukahu.com/rdf-pipeline/fake-data/context.jsonld"}';
            expect(compFactory.updater.bind(this, testData)).to.throw(Error, 
                /shex-cmumps-to-rdf component expects @context and @graph specification on input data!/);
        }); 

        it('should process good input data', function(done) {
            this.timeout(5000);
            var data = fs.readFileSync(testFile);
            var parsedData = JSON.parse(data); 
            return new Promise(function(resolve) { 
               var results = compFactory.updater(parsedData);
               resolve(results);
            }).then(function(results) { 
               results.should.contain('@prefix');
               results.should.contain('urn:local:fhir:DiagnosticReport:');
               results.should.contain('urn:local:fhir:DiagnosticOrder');
               results.should.contain('a fhir:Identifier');
               results.should.contain('fhir:value');
               results.should.contain('fhir:reference');
               done();
            });
        });
    });

});

