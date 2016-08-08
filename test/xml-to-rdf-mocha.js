// xml-to-rdf.js

var chai = require('chai');

var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

var _ = require('underscore');
var fs = require('fs');

var test = require('./common-test');
var compFactory = require('../components/xml-to-rdf');

describe('xml-to-rdf', function() {

    it('should exist as a function', function() {
        compFactory.should.exist;
        compFactory.should.be.a('function');
    });

    it('should instantiate a noflo component', function() {

        var node = test.createComponent(compFactory);
        node.should.be.an('object'); 
        node.should.include.keys('nodeName', 'componentName', 'outPorts', 'inPorts', 'vni', 'vnis');
    }); 

    describe('#xmlToRdf', function() {

        it('should throw an error if no parameters', function() {
            expect(compFactory.updater.bind(this)).to.throw(Error, 
                /Xml-to-rdf component expects sources, fhir-xml-to-rdf xslt, and outdir parameters!/);
        }); 

        it('should throw an error if sources is undefined', function() {
            expect(compFactory.updater.bind(this, undefined)).to.throw(Error, 
                /Xml-to-rdf component expects sources, fhir-xml-to-rdf xslt, and outdir parameters!/);
        }); 

        it('should throw an error if transform is undefined', function() {
            expect(compFactory.updater.bind(this, ['./test/data/testPatient.xml'])).to.throw(Error, 
                /Xml-to-rdf component expects sources, fhir-xml-to-rdf xslt, and outdir parameters!/);
        }); 

        it('should NOT throw an error if classpath is undefined', function() {
            expect(compFactory.updater.bind(this, 
                                            ['./test/data/testPatient.xml'], undefined, './xslt/fhir-xml-to-rdf.xsl', '/tmp')).to.not.throw.error;
        }); 


        it('should throw an error if outdir is undefined', function() {
            expect(compFactory.updater.bind(this, 
                                            ['./test/data/testPatient.xml'], 
                                             test.saxonClasspath(),
                                             './xslt/fhir-xml-to-rdf.xsl')).to.throw(Error, 
                /Xml-to-rdf component expects sources, fhir-xml-to-rdf xslt, and outdir parameters!/);
        }); 

        it('should translate xml to rdf with good input parameters', function() {
            var node = test.createComponent(compFactory);

            // Get classpath for this operating system 
            var classpath = test.saxonClasspath();

            expect(compFactory.updater.call(node.vni(''), 
                                            ['./test/data/testPatient.xml'], 
                                            classpath,
                                            './xslt/fhir-xml-to-rdf.xsl',
                                            '/tmp/')).to.not.throw.error;
        }); 
   });

   describe('functional behavior', function() {
       it('should translate patient demographics fhir xml to RDF in a noflo network', function() {
          this.timeout(3500);
           return test.createNetwork(
                { node1: 'core/Repeat',
                  node2: 'core/Repeat',
                  node3: 'core/Repeat',
                  node4: 'core/Repeat',
                  node5: { getComponent: compFactory }
            }).then(function(network) {

                return new Promise(function(done, fail) {

                    // True noflo component - not facade
                    var node1 = network.processes.node1.component;
                    var node2 = network.processes.node2.component;
                    var node3 = network.processes.node3.component;
                    var node4 = network.processes.node4.component;
                    var node5 = network.processes.node5.component;

                    test.onOutPortData(node5, 'output', done);
                    test.onOutPortData(node5, 'error', fail);

                    network.graph.addEdge('node1', 'out', 'node5', 'sources');
                    network.graph.addEdge('node2', 'out', 'node5', 'classpath');
                    network.graph.addEdge('node3', 'out', 'node5', 'transform');
                    network.graph.addEdge('node4', 'out', 'node5', 'outdir');

                    network.graph.addInitial( ['./test/data/testPatient.xml'], 'node1', 'in');
                    
                    var classpath = test.saxonClasspath();
                    network.graph.addInitial(classpath, 'node2', 'in');

                    network.graph.addInitial('./xslt/fhir-xml-to-rdf.xsl', 'node3', 'in');
                    network.graph.addInitial('/tmp/', 'node4', 'in');

                }).then(function(done) {

                    done.should.exist;
                    done.should.not.be.empty;
                    done.should.be.an('object');

                    done.should.have.all.keys('vnid','data','groupLm','lm','stale','error');
                    done.vnid.should.equal('');
                    done.data.should.be.an('array');
                    done.data.should.have.length(1);
                    done.data[0].should.contain('urn:local:fhir:Patient:2-000007.ttl');
                    expect(done.error).to.be.undefined;
                    expect(done.stale).to.be.undefined;
                    expect(done.groupLm).to.be.undefined;
                    done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);

                    // Now check the file
                    var results = fs.readFileSync(done.data[0], 'utf8');
                    results.should.contain('fhir:Patient');
                    results.should.contain('fhir:Identifier');
                    results.should.contain('fhir:HumanName');
                    results.should.contain('fhir:Address');
                    results.should.contain('fhir:Patient.gender');
                    results.should.contain('fhir:Patient.birthDate');
                    results.should.contain('fhir:Patient.maritalStatus');

                }, function(fail) {
                    assert.fail(fail);
                });
           });
       });

       it('should translate patient prescription fhir xml to RDF in a noflo network', function() {
          this.timeout(3750);
           return test.createNetwork(
                { node1: 'core/Repeat',
                  node2: 'core/Repeat',
                  node3: 'core/Repeat',
                  node4: 'core/Repeat',
                  node5: { getComponent: compFactory }
            }).then(function(network) {

                return new Promise(function(done, fail) {

                    // True noflo component - not facade
                    var node1 = network.processes.node1.component;
                    var node2 = network.processes.node2.component;
                    var node3 = network.processes.node3.component;
                    var node4 = network.processes.node4.component;
                    var node5 = network.processes.node5.component;

                    test.onOutPortData(node5, 'output', done);
                    test.onOutPortData(node5, 'error', fail);

                    network.graph.addEdge('node1', 'out', 'node5', 'sources');
                    network.graph.addEdge('node2', 'out', 'node5', 'classpath');
                    network.graph.addEdge('node3', 'out', 'node5', 'transform');
                    network.graph.addEdge('node4', 'out', 'node5', 'outdir');

		    network.graph.addInitial( ['./test/data/testPrescript.xml'], 'node1', 'in');
                    
                    var classpath = test.saxonClasspath();
                    network.graph.addInitial(classpath, 'node2', 'in');

                    network.graph.addInitial('./xslt/fhir-xml-to-rdf.xsl', 'node3', 'in');
                    network.graph.addInitial('/tmp/', 'node4', 'in');

                }).then(function(done) {

                    done.should.exist;
                    done.should.not.be.empty;
                    done.should.be.an('object');

                    done.should.have.all.keys('vnid','data','groupLm','lm','stale','error');
                    done.vnid.should.equal('');
                    done.data.should.be.an('array');
                    done.data.should.have.length(1);
                    done.data[0].should.contain('urn:local:fhir:MedicationDispense:52-7810413.ttl');
                    expect(done.error).to.be.undefined;
                    expect(done.stale).to.be.undefined;
                    expect(done.groupLm).to.be.undefined;
                    done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);

                    // Now check the file
                    var results = fs.readFileSync(done.data[0], 'utf8');
                    results.should.contain('fhir:MedicationDispense');
                    results.should.contain('fhir:Identifier');
                    results.should.contain('fhir:MedicationDispense.authorizingPrescription'); 
                    results.should.contain('fhir:MedicationDispense.dispenser');
                    results.should.contain('fhir:Quantity');
                    results.should.contain('fhir:MedicationDispense.dosageInstruction');
                    results.should.contain('fhir:MedicationDispense.whenPrepared');

                }, function(fail) {
                    assert.fail(fail);
                });
           });
       });

       it('should translate patient procedures fhir xml to RDF in a noflo network', function() {
          this.timeout(3500);
           return test.createNetwork(
                { node1: 'core/Repeat',
                  node2: 'core/Repeat',
                  node3: 'core/Repeat',
                  node4: 'core/Repeat',
                  node5: { getComponent: compFactory }
            }).then(function(network) {

                return new Promise(function(done, fail) {

                    // True noflo component - not facade
                    var node1 = network.processes.node1.component;
                    var node2 = network.processes.node2.component;
                    var node3 = network.processes.node3.component;
                    var node4 = network.processes.node4.component;
                    var node5 = network.processes.node5.component;

                    test.onOutPortData(node5, 'output', done);
                    test.onOutPortData(node5, 'error', fail);

                    network.graph.addEdge('node1', 'out', 'node5', 'sources');
                    network.graph.addEdge('node2', 'out', 'node5', 'classpath');
                    network.graph.addEdge('node3', 'out', 'node5', 'transform');
                    network.graph.addEdge('node4', 'out', 'node5', 'outdir');

		    network.graph.addInitial( ['./test/data/testProcedure1.xml', './test/data/testProcedure2.xml'], 'node1', 'in');
                    
                    var classpath = test.saxonClasspath();
                    network.graph.addInitial(classpath, 'node2', 'in');

                    network.graph.addInitial('./xslt/fhir-xml-to-rdf.xsl', 'node3', 'in');
                    network.graph.addInitial('/tmp/', 'node4', 'in');

                }).then(function(done) {

                    done.should.exist;
                    done.should.not.be.empty;
                    done.should.be.an('object');

                    done.should.have.all.keys('vnid','data','groupLm','lm','stale','error');
                    done.vnid.should.equal('');
                    done.data.should.be.an('array');
                    done.data.should.have.length(2);

                    var doneData = done.data.toString();
                    doneData.should.contain('urn:local:fhir:Procedure:Procedure-1074046.ttl');
                    doneData.should.contain('urn:local:fhir:Procedure:Procedure-1277097.ttl');

                    expect(done.error).to.be.undefined;
                    expect(done.stale).to.be.undefined;
                    expect(done.groupLm).to.be.undefined;
                    done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);

                    // Now check the file
                    var results = fs.readFileSync(done.data[0], 'utf8');

                    results.should.contain('fhir:Procedure');
                    results.should.contain('fhir:Procedure.identifier');
                    results.should.contain('fhir:Procedure.subject'); 
                    results.should.contain('fhir:Procedure.code');
                    results.should.contain('fhir:Procedure.category');
                    results.should.contain('fhir:Procedure.status');
                    results.should.contain('fhir:Procedure.performeddateTime');
                    results.should.contain('fhir:Procedure.encounter');

                }, function(fail) {
                    assert.fail(fail);
                });
           });
       });

   });
});

