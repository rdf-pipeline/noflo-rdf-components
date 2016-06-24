// cmumps2fhir-procedures-mocha.js

var chai = require('chai');

var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var _ = require('underscore');
var fs = require('fs');

var test = require('./common-test');
var compFactory = require('../components/cmumps2fhir-procedures');

var testFile = __dirname + '/../node_modules/translators/data/fake_cmumps/patient-7/cmumps-patient7.jsonld';

describe('cmumps2fhir-procedures', function() {
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

        it('should throw an error if data is undefined', function() {
            expect(compFactory.updater.bind(this, undefined)).to.throw(Error,
                /PatientProcedures requires data to translate!/);
        });

        it('should return empty object if data is empty', function() {
            sinon.stub(console, 'warn');
            expect(compFactory.updater({})).to.be.empty;
            console.warn.restore();
        });

        it('should convert patient procedures to fhir', function() {
            var data = fs.readFileSync(testFile);
            var parsedData = JSON.parse(data); // readfile gives us a json object, so parse it

            sinon.stub(console, 'log');
            var translation = compFactory.updater(parsedData);
            console.log.restore();

            translation.should.not.be.empty;
            translation.should.be.an('array');
            translation.should.have.length(1);
            translation[0].should.include.keys('resourceType', 'identifier', 'subject', 'status',
                                               'category', 'code', 'performedDateTime', 'encounter');
            translation[0].resourceType.should.equal('Procedure');
        });

        it('should write data to the specified intermediate files', function() {

            var data = fs.readFileSync(testFile);
            var parsedData = JSON.parse(data); // readfile gives us a json object, so parse it
            var cmumpsFile='/tmp/cmumpsProcedures.out';
            var fhirFile='/tmp/fhirProcedures.out';

            test.rmFile(cmumpsFile);
            test.rmFile(fhirFile);

            sinon.stub(console, 'log');
            var translation = compFactory.updater(parsedData, cmumpsFile, fhirFile);
            console.log.restore();

            translation.should.not.be.empty;

            // Verify the expected 2 files exist
            fs.accessSync(cmumpsFile, fs.F_OK);
            fs.accessSync(fhirFile, fs.F_OK);
        });
    });

    describe('functional behavior', function() {
       it('should convert patient procedures to fhir in a noflo network', function() {
           this.timeout(3000);
           sinon.stub(console,'log');
           return test.createNetwork(
                { node1: 'filesystem/ReadFile',
                  node2: 'core/Repeat',
                  node3: 'core/Repeat',
                  node4: 'rdf-components/cmumps2fhir-procedures'
            }).then(function(network) {

                return new Promise(function(done, fail) {

                    var node1 = network.processes.node1.component;
                    var node2 = network.processes.node2.component;
                    var node3 = network.processes.node3.component;
                    var node4 = network.processes.node4.component;

                    test.onOutPortData(node4, 'output', done);
                    test.onOutPortData(node4, 'error', fail);

                    network.graph.addEdge('node1', 'out', 'node4', 'data');
                    network.graph.addEdge('node2', 'out', 'node4', 'cmumps_file');
                    network.graph.addEdge('node3', 'out', 'node4', 'fhir_file');

                    network.graph.addInitial(testFile, 'node1', 'in');
                    network.graph.addInitial('', 'node2', 'in');
                    network.graph.addInitial('', 'node3', 'in');

                }).then(function(done) {
                    console.log.restore();
                    done.should.exist;
                    done.should.not.be.empty;
                    done.should.be.an('object');

                    done.should.have.all.keys('vnid','data','groupLm','lm','stale','error');
                    done.vnid.should.equal('');
                    done.data.should.be.an('array');
                    done.data.should.have.length(1);
                    done.data[0].should.include.keys('resourceType', 'identifier', 'subject', 'status',
                                                     'category', 'code', 'performedDateTime', 'encounter');
                    done.data[0].resourceType.should.equal('Procedure');
                    expect(done.error).to.be.undefined;
                    expect(done.stale).to.be.undefined;
                    done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                }, function(fail) {
                    console.log.restore();
                    console.log('fail: ',fail);
                    throw Error(fail);
                });
           });
       });
   });
});

