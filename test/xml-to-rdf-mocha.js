// xml-to-rdf.js

var chai = require('chai');

var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

var _ = require('underscore');

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

        it('should throw an error if sources is undefined', function() {
            expect(compFactory.updater.bind(this, undefined)).to.throw(Error, 
                /Xml-to-rdf component expects both sources and transform parameters!/);
        }); 

        it('should throw an error if transform is undefined', function() {
            expect(compFactory.updater.bind(this, ['./test/data/testPatient.xml'])).to.throw(Error, 
                /Xml-to-rdf component expects both sources and transform parameters!/);
        }); 

        it('should not throw an error if classpath is undefined', function() {
            expect(compFactory.updater.bind(this, 
                                            ['./test/data/testPatient.xml'], undefined, './lib/xslt/transform.xsl')).to.not.throw.error;
        }); 

        it('should translate xml to rdf with good input parameters', function() {
            var node = test.createComponent(compFactory);

            // Get classpath for this operating system 
            var classpath = test.saxonClasspath();

            expect(compFactory.updater.call(node.vni(''), 
                                            ['./test/data/testPatient.xml'], 
                                            classpath,
                                            './lib/xslt/transform.xsl')).to.not.throw.error;
        }); 
   });

   describe('functional behavior', function() {
       it('should translate xml to RDF in a noflo network', function() {
           return test.createNetwork(
                { node1: 'core/Repeat',
                  node2: { getComponent: compFactory }
            }).then(function(network) {

                return new Promise(function(done, fail) {

                    // True noflo component - not facade
                    var node1 = network.processes.node1.component;
                    var node2 = network.processes.node2.component;

                    test.onOutPortData(node2, 'output', done);
                    test.onOutPortData(node2, 'error', fail);

                    network.graph.addEdge('node1', 'out', 'node2', 'sources');

                    network.graph.addInitial( ['./test/data/testPatient.xml'], 'node1', 'in');
                    
                    var classpath = test.saxonClasspath();
                    network.graph.addInitial(classpath, 'node2', 'classpath');

                    network.graph.addInitial('./lib/xslt/transform.xsl', 'node2', 'transform');

                }).then(function(done) {

                    done.should.exist;
                    done.should.not.be.empty;
                    done.should.be.an('object');

                    done.should.have.all.keys('vnid','data','lm','stale','error');
                    done.vnid.should.equal('');
                    done.data[0].should.contain('fhir:Patient');
                    done.data[0].should.contain('fhir:Identifier');
                    done.data[0].should.contain('fhir:HumanName');
                    done.data[0].should.contain('fhir:Address');
                    done.data[0].should.contain('fhir:Patient.gender');
                    done.data[0].should.contain('fhir:Patient.birthDate');
                    done.data[0].should.contain('fhir:Patient.maritalStatus');
                    expect(done.error).to.be.undefined;
                    expect(done.stale).to.be.undefined;
                    done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);

                }, function(fail) {
                    assert.fail(fail);
                });
           });
       });
   });
});

