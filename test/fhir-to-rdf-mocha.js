// fhir-to-rdf.js

var chai = require('chai');

var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

var _ = require('underscore');
var fs = require('fs');

var test = require('./common-test');

describe('fhir-to-rdf', function() {

    it('should translate patient demographics fhir to RDF in a noflo network', function() {
        this.timeout(5000);
        return test.createNetwork(
            { node1: 'core/Repeat',
              node2: 'core/Repeat',
              node3: 'core/Repeat',
              fhirToRdf: 'rdf-components/fhir-to-rdf'
        }).then(function(network) {

            return new Promise(function(done, fail) {

                // True noflo component - not facade
                var node1 = network.processes.node1.component;
                var node2 = network.processes.node2.component;
                var node3 = network.processes.node3.component;
                var fhirToRdf = network.processes.fhirToRdf.component;

                test.onOutPortData(fhirToRdf, 'output', done);

                network.graph.addEdge('node1', 'out', 'fhirToRdf', 'fhir');
                network.graph.addEdge('node2', 'out', 'fhirToRdf', 'classpath');
                network.graph.addEdge('node3', 'out', 'fhirToRdf', 'outdir');

                var data = fs.readFileSync('test/data/testFhirPatient.json');
                var parsedData = JSON.parse(data);

                network.graph.addInitial( parsedData, 'node1', 'in');
                
                var classpath = test.saxonClasspath();
                network.graph.addInitial(classpath, 'node2', 'in');

                network.graph.addInitial('/tmp/', 'node3', 'in');

            }).then(function(done) {

                done.should.exist;
                done.should.not.be.empty;
                done.should.be.an('object');

                done.should.have.all.keys('vnid','data','groupLm','lm',
                                          'stale','error', 'componentName');
                done.vnid.should.equal('');
                done.data.should.be.an('string');
                done.data.startsWith('/tmp/rdf-fhir-2-000007-').should.be.true;
                expect(done.error).to.be.undefined;
                expect(done.stale).to.be.undefined;
                expect(done.groupLm).to.be.undefined;
                done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                done.componentName.should.equal('rdf-components/xml-to-rdf');

                // Now check the file
                var results = fs.readFileSync(done.data, 'utf8');
                results.should.contain('fhir:Patient');
                results.should.contain('fhir:Identifier');
                results.should.contain('fhir:HumanName');
                results.should.contain('fhir:Address');
                results.should.contain('fhir:Patient.gender');
                results.should.contain('fhir:Patient.birthDate');
                results.should.contain('fhir:Patient.maritalStatus');

            });
       });
   });
});

