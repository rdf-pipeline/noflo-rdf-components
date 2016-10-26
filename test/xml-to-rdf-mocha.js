// xml-to-rdf.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

var _ = require('underscore');
var fs = require('fs');
var os = require('os');

var test = require('./common-test');
var compFactory = require('../components/xml-to-rdf');
var logger = require('../src/logger');

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

            // Get classpath for this operating system and check it exists
            var classpath = test.saxonClasspath();
            if (!fs.statSync(classpath).isFile()) {
                throw Error('    Required library file ' + classpath + ' does not exist.');
            }

            var node = test.createComponent(compFactory);

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

           // Get classpath for this operating system and check it exists
           var classpath = test.saxonClasspath();
           if (!fs.statSync(classpath).isFile()) {
               throw Error('    Required library file ' + classpath + ' does not exist.');
           }

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
                    network.graph.addInitial(classpath, 'node2', 'in');
                    network.graph.addInitial('./xslt/fhir-xml-to-rdf.xsl', 'node3', 'in');
                    network.graph.addInitial('/tmp/', 'node4', 'in');

                }).then(function(done) {

                    done.should.exist;
                    done.should.not.be.empty;
                    done.should.be.an('object');

                    done.should.have.all.keys('vnid','data','groupLm','lm','stale','error', 'componentName');
                    done.vnid.should.equal('');
                    done.data.should.be.a('string');
                    done.data.should.contain('/tmp/rdf-fhir-urn:local:fhir:Patient:2-000007-');
                    expect(done.error).to.be.undefined;
                    expect(done.stale).to.be.undefined;
                    expect(done.groupLm).to.be.undefined;
                    done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                    done.componentName.should.equal('node5');

                    // Now check the file
                    var results = fs.readFileSync(done.data, 'utf8');
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
          this.timeout(4000);
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

                    done.should.have.all.keys('vnid','data','groupLm','lm','stale','error', 'componentName');
                    done.vnid.should.equal('');
                    done.data.should.be.a('string');
                    done.data.should.contain('/tmp/rdf-fhir-urn:local:fhir:MedicationDispense:52-7810413-');
                    expect(done.error).to.be.undefined;
                    expect(done.stale).to.be.undefined;
                    expect(done.groupLm).to.be.undefined;
                    done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                    done.componentName.should.equal('node5');

                    // Now check the file
                    var results = fs.readFileSync(done.data, 'utf8');
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
          this.timeout(4000);
           return test.createNetwork(
                { sources: 'core/Repeat',
                  xmlToRdf: { getComponent: compFactory }
            }).then(function(network) {
                var sources = network.processes.sources.component;
                var xmlToRdf = network.processes.xmlToRdf.component;
                network.graph.addEdge('sources', 'out', 'xmlToRdf', 'sources');
    
                return new Promise(function(done, fail) {

                    test.onOutPortData(xmlToRdf, 'output', done);
                    test.onOutPortData(xmlToRdf, 'error', fail);

                    network.graph.addInitial(['./test/data/testProcedure1.xml',
                                              './test/data/testProcedure2.xml'],
                                             'sources', 
                                             'in');

                    var classpath = test.saxonClasspath();
                    network.graph.addInitial(classpath, 'xmlToRdf', 'classpath');

                    network.graph.addInitial('./xslt/fhir-xml-to-rdf.xsl', 'xmlToRdf', 'transform');
                    network.graph.addInitial('/tmp/', 'xmlToRdf', 'outdir');

                }).then(function(done) {

                    done.should.exist;
                    done.should.not.be.empty;
                    done.should.be.an('object');

                    done.should.have.all.keys('vnid','data','groupLm','lm','stale','error', 'componentName');
                    done.vnid.should.equal('');

                    done.data.should.be.an('array');
                    done.data.should.have.length(2);
                    var doneData = done.data.toString();
                    doneData.should.contain('/tmp/rdf-fhir-urn:local:fhir:Procedure:Procedure-1074046-');
                    doneData.should.contain('/tmp/rdf-fhir-urn:local:fhir:Procedure:Procedure-1277097-');

                    expect(done.error).to.be.undefined;
                    expect(done.stale).to.be.undefined;
                    expect(done.groupLm).to.be.undefined;
                    done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                    done.componentName.should.equal('xmlToRdf');

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

   describe('memory testing', function() {

       /**
        * This test currently fails because there is a memory leak in the xslt4node library.
        * See: https://github.com/e2ebridge/xslt4node/issues/9
        */
       it('heap should not grow and free memory should not drop significantly', function(done) {

           // verify we can control garbage collection for this test.
           if (_.isUndefined(global.gc)) {
               logger.warn('        skipping heap growth test; run with --expose-gc');
               return done();
           }

           this.timeout(5000);

           return test.createNetwork(
                { sources: 'core/Repeat',
                  xmlToRdf: { getComponent: compFactory }

            }).then(function(network) {
                var sources = network.processes.sources.component;
                var xmlToRdf = network.processes.xmlToRdf.component;
                
                network.graph.addEdge('sources', 'out', 'xmlToRdf', 'sources');

                var max = 10;
                var inputs = [];
                for (var i=0; i < max; i++) { 
                    inputs.push(['./test/data/testProcedure1.xml', './test/data/testProcedure2.xml']);
                }

                var count = 0;
                var validator = function(vni) { 
                    count++;
                    vni.vnid.should.equal('');
                    vni.data.should.be.an('array');
                    var data = vni.data.toString();
                    data.should.contain('/tmp/rdf-fhir-urn:local:fhir:Procedure:Procedure-1074046-');
                    data.should.contain('/tmp/rdf-fhir-urn:local:fhir:Procedure:Procedure-1277097-');
                    expect(vni.error).to.be.undefined;
                    expect(vni.stale).to.be.undefined;
                    expect(vni.groupLm).to.be.undefined;
                    vni.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                    vni.componentName.should.equal('xmlToRdf');
                };

                // Build a list of promises to execute a component request
                var promiseFactories =  _.map(inputs, function(input, i) {
                    var payload = (i == 0) ? [{payload: input, componentName: 'xmlToRdf', portName: 'sources'},
                                              {payload: test.saxonClasspath(), componentName: 'xmlToRdf', portName: 'classpath'},
                                              {payload: './xslt/fhir-xml-to-rdf.xsl', componentName: 'xmlToRdf', portName: 'transform'},
                                              {payload: '/tmp/', componentName: 'xmlToRdf', portName: 'outdir'}]
                                           : [{payload: input, componentName: 'xmlToRdf', portName: 'sources'}];
                    return test.executePromise.bind(test, network, xmlToRdf, payload, validator);
                });

                // Garbage collect & get initial heap use
                global.gc();
                var initHeap = process.memoryUsage().heapUsed;
                var initFreeMem = os.freemem();
                
                // Execute our 100 calls to funnel, one at a time
                return Promise.resolve(test.executeSequentially(promiseFactories)).then(function(results) {
                       global.gc();

                       // check to see if the heap has grown or not
                       var finishHeap = process.memoryUsage().heapUsed;
                       var heapDelta = finishHeap - initHeap;
                       if (heapDelta > 0) {
                           logger.error('\n        Component heap grew after a run with ' + max +
                                         ' component calls!  Heap difference=' + test.bytesToMB(heapDelta));
                           heapDelta.should.not.be.above(0);
                       }

                       // check whether our free memory has decreased
                       var finishMem = os.freemem();
                       var freeMemDelta = finishMem - initFreeMem;
                       if (freeMemDelta < 0) {
                           logger.error('\n        O/S Free memory descreased after a run with ' + max +
                                         ' component calls!  Free memory difference=' + test.bytesToMB(-freeMemDelta));
                           freeMemDelta.should.not.be.below(0);
                       } 
                       done();
                });
            });
       });
   });
});

