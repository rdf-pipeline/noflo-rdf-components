// shex-cmumps-to-rdf-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

var _ = require('underscore');
var fs = require('fs');
var winston = require('winston');

var logger = require('../src/logger');
var test = require('./common-test');
var compFactory = require('../components/shex-cmumps-to-rdf');

var testFile = __dirname + '/../node_modules/translators/data/fake_cmumps/patient-7/cmumps-patient7.jsonld';
var graphContext = {
    "@context": {
        fhir: "http://hl7.org/fhir/",
        cmumps: "http://hokukahu.com/systems/cmumps-1/",
        xs: "http://www.w3.org/2001/XMLSchema#",
        prov: "http://www.w3.org/ns/prov#",
        "loinc": "http://hokukahu.com/schema/loinc#",
        "hptc": "http://hokukahu.com/schema/hptc#",
        "cpt": "http://hokukahu.com/schema/cpt#",
        "ndc": "http://hokukahu.com/schema/ndc#",
        "icd9cm": "http://hokukahu.com/schema/icd9cm#",
        "npi": "http://hokukahu.com/schema/npi#",
        "nddf": "http://hokukahu.com/schema/nddf#",
        "@vocab": "http://hokukahu.com/schema/cmumpss#",
        "cmumpss": "http://hokukahu.com/schema/cmumpss#",
        "xsd": "http://www.w3.org/2001/XMLSchema#",
        "@base": "http://hokukahu.com/systems/cmumps-1/",
        "_id": "@id",
        "id": "@id",
        "type": "@type",
        "list": "@list",
        "value": "@value",
        "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
        "label": {
            "@id": "rdfs:label"
        },
        "owl": "http://www.w3.org/2002/07/owl#",
        "fms": "http://datasets.caregraf.org/fms/",
        "sameAs": {
            "@id": "owl:sameAs",
            "@type": "@id"
        },
        "sameAsLabel": {
            "@id": "fms:sameAsLabel"
        }
   }
};
describe('shex-cmumps-to-rdf', function() {
    logger.remove('console');

    it('should exist as a function', function() {
        compFactory.should.exist;
        compFactory.should.be.a('function');
    });

    it('should instantiate a noflo component', function() {
        var node = test.createComponent(compFactory);
        node.should.be.an('object');
        node.should.include.keys('nodeName', 'componentName', 'outPorts', 'inPorts', 'vni', 'vnis');
    });

    it('should throw an error if no parameters', function() {
        return new Promise(function(done, fail) {
            test.createNetwork({
                shex: "rdf-components/shex-cmumps-to-rdf"
            }).then(function(network) {
                test.onOutPortData(network.processes.shex.component, 'error', done);
                network.graph.addInitial('', 'shex', 'input');
            }).catch(fail);
        }).should.eventually.have.deep.property('data.message').string("requires cmumps data");
    }); 

    it('should throw an error if passed invalid JSON', function() {
        return new Promise(function(done, fail) {
            test.createNetwork({
                shex: "rdf-components/shex-cmumps-to-rdf"
            }).then(function(network) {
                test.onOutPortData(network.processes.shex.component, 'error', done);
                network.graph.addInitial('A bad JSON String', 'shex', 'input');
            }).catch(fail);
        }).should.eventually.have.deep.property('data.message').string("unable to parse input");
    }); 

    it('should throw an error if passed input data with no context', function() {
        return new Promise(function(done, fail) {
            test.createNetwork({
                shex: "rdf-components/shex-cmumps-to-rdf"
            }).then(function(network) {
                test.onOutPortData(network.processes.shex.component, 'error', done);
                network.graph.addInitial({
                    "@graph": [{
                        "type": "cmumpss:Patient-2",
                        "_id": "2-000007"
                    }]
                }, 'shex', 'input');
            }).catch(fail);
        }).should.eventually.have.deep.property('data.message').string("expects @context");
    }); 

    it('should throw an error if passed input data with no graph', function() {
        return new Promise(function(done, fail) {
            test.createNetwork({
                shex: "rdf-components/shex-cmumps-to-rdf"
            }).then(function(network) {
                test.onOutPortData(network.processes.shex.component, 'error', done);
                network.graph.addInitial({
                    "@context": "https://hokukahu.com/rdf-pipeline/fake-data/context.jsonld"
                }, 'shex', 'input');
            }).catch(fail);
        }).should.eventually.have.deep.property('data.message').match(/expects.*graph/);
    }); 

    it('should process good input data', function() {
        this.timeout(5000);
        return new Promise(function(done, fail) {
            test.createNetwork({
                shex: "rdf-components/shex-cmumps-to-rdf",
                jsonld: "rdf-components/frame-jsonld"
            }).then(function(network) {
                network.graph.addInitial(graphContext, 'jsonld', 'context');
                network.graph.addEdge('shex', 'output', 'jsonld', 'json');
                var data = JSON.parse(fs.readFileSync(testFile));
                test.onOutPortData(network.processes.jsonld.component, 'output', function(output) {
                    if (!output.error) done(output.data);
                });
                test.onOutPortData(network.processes.shex.component, 'error', fail);
                test.onOutPortData(network.processes.jsonld.component, 'error', fail);
                network.graph.addInitial(data, 'shex', 'input');
            }).catch(fail);
        }).then(function(jsonld) {
            return JSON.stringify(jsonld, null, 2);
        }).then(function(output) {
            output.should.contain('urn:local:fhir:DiagnosticReport:');
            output.should.contain('urn:local:fhir:DiagnosticOrder');
            output.should.contain('"type": "fhir:Identifier"');
            output.should.contain('fhir:value');
            output.should.contain('fhir:reference');
        });
    });

    it('should set target graph', function() {
        this.timeout(5000);
        var target = "urn:local:rdf-components%2Ftranslate-demographics-cmumps2fhir:Patient:2-000007";
        return new Promise(function(done, fail) {
            test.createNetwork({
                shex: "rdf-components/shex-cmumps-to-rdf"
            }).then(function(network) {
                network.graph.addInitial(target, 'shex', 'target_graph');
                network.graph.addInitial("urn:local:graph:source", 'shex', 'source_graph');
                network.graph.addInitial("urn:local:mGraph", 'shex', 'meta_graph');
                var data = JSON.parse(fs.readFileSync(testFile));
                test.onOutPortData(network.processes.shex.component, 'output', function(output) {
                    if (!output.error) done(output.data);
                });
                test.onOutPortData(network.processes.shex.component, 'error', fail);
                network.graph.addInitial(data, 'shex', 'input');
            }).catch(fail);
        }).then(function(jsonld) {
            jsonld.map(function(graphs) {
                return graphs['@id'];
            }).should.have.members([target, "urn:local:mGraph"]);
            jsonld[0].should.have.property('@id', target);
            _.keys(jsonld[1]['@graph'][0]).should.have.members(['@id', '@type', 'meta:patientId', 'meta:fhirResourceType', 'prov:wasDerivedFrom', 'prov:generatedAtTime', 'meta:translatedBy']);
            return JSON.stringify(jsonld, null, 2);
        }).then(function(output) {
            output.should.contain('urn:local:fhir:DiagnosticReport:');
            output.should.contain('urn:local:fhir:DiagnosticOrder');
        });
    });

});

