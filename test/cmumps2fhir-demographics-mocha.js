// cmumps2fhir-demographics-mocha.js

var chai = require('chai');

var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var _ = require('underscore');
var fs = require('fs');

var test = require('./common-test');
var compFactory = require('../components/cmumps2fhir-demographics');

var testFile = __dirname + '/../node_modules/translators/data/fake_cmumps/patient-7/cmumps-patient7.jsonld';

describe('cmumps2fhir-demographics', function() {

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

        it('should throw an error if input data is undefined', function() {
            expect(compFactory.updater.bind(this, undefined)).to.throw(Error,
                /PatientDemographics requires data to translate!/);
        });

        it('should return empty object if input data is empty', function() {
            sinon.stub(console, 'warn');
            expect(compFactory.updater({})).to.be.empty;
            console.warn.restore();
        });

        it('should convert patient demographics to fhir', function() {
            var data = fs.readFileSync(testFile);
            var parsedData = JSON.parse(data); // readfile gives us a json object, so parse it
            var translation = compFactory.updater(parsedData);
            translation.should.not.be.empty;
            translation.should.include.keys('resourceType', 'identifier', 'name', 'gender', 
                                            'birthDate', 'address','birthDate');
            translation.resourceType.should.equal('Patient');
        });

        it('should write data to the specified intermediate files', function() {

            var data = fs.readFileSync(testFile);
            var parsedData = JSON.parse(data); // readfile gives us a json object, so parse it
            var cmumpsFile='/tmp/cmumpsDemographics.out';
            var fhirFile='/tmp/fhirDemographics.out';

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
       it('should convert patient demographics to fhir in a noflo network', function() {
           this.timeout(3000);
           return test.createNetwork(
                { node1: 'filesystem/ReadFile',
                  node2: 'core/Repeat',
                  node3: 'core/Repeat',
                  node4: 'rdf-components/cmumps2fhir-demographics'
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
                    done.should.exist;
                    done.should.not.be.empty;
                    done.should.be.an('object');

                    done.should.have.all.keys('vnid','data','groupLm','lm','stale','error');
                    done.vnid.should.equal('');
                    done.data.should.be.an('object');
                    done.data.should.include.keys('resourceType', 'identifier', 'name', 'gender', 
                                                  'birthDate', 'address','birthDate');
                    done.data.resourceType.should.equal('Patient');
                    expect(done.error).to.be.undefined;
                    expect(done.stale).to.be.undefined;
                    done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
    
                }, function(fail) {
                    console.log('fail: ',fail);
                    throw Error(fail);
                });
            });
       });
   });
});


