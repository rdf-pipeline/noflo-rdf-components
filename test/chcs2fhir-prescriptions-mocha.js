// chcs2fhir-prescriptions-mocha.js

var chai = require('chai');

var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var _ = require('underscore');
var fs = require('fs');

var test = require('./common-test');
var compFactory = require('../components/chcs2fhir-prescriptions');

describe('chcs2fhir-prescriptions', function() {
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

        it('should throw an error if chcs is undefined', function() {
            expect(compFactory.updater.bind(this, undefined)).to.throw(Error,
                /PatientPrescriptions requires CHCS data input to translate!/);
        });

        it('should return empty object if chcs is empty', function() {
            sinon.stub(console, 'warn');
            expect(compFactory.updater({})).to.be.empty;
            console.warn.restore();
        });

        it('should convert chcs patient prescriptions to fhir', function() {
            try {
                var chcs = fs.readFileSync('../rdftransforms/data/fake_chcs/patient-7/chcs-patient7.jsonld');
                var parsedChcs = JSON.parse(chcs); // readfile gives us a json object, so parse it
                sinon.stub(console, 'log');
                var translation = compFactory.updater(parsedChcs);
                console.log.restore();
                translation.should.not.be.empty;
                translation.should.be.an('array');
                translation.should.have.length(6);
                translation[0].should.include.keys('resourceType','identifier','status','patient',
                                                   'quantity','dispenser','dosageInstruction');
                translation[0].resourceType.should.equal('MedicationDispense');
            } catch(e) {
                if (e.code === 'ENOENT') {
                    console.log('        Test data is not available - skipping this test.');
                    return;
                }
                throw e;
            }
        });
    });

    describe('functional behavior', function() {
       it('should convered chcs patient prescriptions to fhir in a noflo network', function() {

           var chcsFile = '../rdftransforms/data/fake_chcs/patient-7/chcs-patient7.jsonld';
           if (test.fileExists(chcsFile)) {
               return test.createNetwork(
                    { node1: 'filesystem/ReadFile',
                      node2: { getComponent: compFactory }
                }).then(function(network) {

                    return new Promise(function(done, fail) {

                        // True noflo component - not facade
                        var node1 = network.processes.node1.component;
                        var node2 = network.processes.node2.component;

                        test.onOutPortData(node2, 'output', done);
                        test.onOutPortData(node2, 'error', fail);

                        network.graph.addEdge('node1', 'out', 'node2', 'chcs');

                        sinon.stub(console, 'log');
                        network.graph.addInitial(chcsFile, 'node1', 'in');

                    }).then(function(done) {
                        console.log.restore();
                        done.should.exist;
                        done.should.not.be.empty;
                        done.should.be.an('object');

                        done.should.have.all.keys('vnid','data','lm','stale','error');
                        done.vnid.should.equal('');
                        done.data.should.be.an('array');
                        done.data.should.have.length(6);
                        done.data[0].should.include.keys('resourceType','identifier','status','patient',
                                                         'quantity','dispenser','dosageInstruction');
                        done.data[0].resourceType.should.equal('MedicationDispense');
                        expect(done.error).to.be.undefined;
                        expect(done.stale).to.be.undefined;
                        done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);

                    }, function(fail) {
                        console.log.restore();
                        console.log('fail: ',fail);
                        assert.fail(fail);
                    });
               });
           } else {
               console.log('        CHCS test file is not available.  Skipping this test.');
           }
       });
   });
});


