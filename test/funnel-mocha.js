// funnel-mocha.js

var _ = require('underscore');

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var test = require('./common-test');
var factory = require('../components/funnel');
var logger = require('../src/logger');
var profiler = require('../src/profiler');

describe('funnel', function() {

    it('should exist as a function', function() {
        factory.should.exist;
        factory.should.be.a('function');
    });

    it('should instantiate a noflo component', function() {
        var node = test.createComponent(factory);
        node.should.be.an('object');
        node.should.include.keys('nodeName', 'componentName', 'outPorts', 'inPorts', 'vni', 'vnis');
    });

    describe('#updater', function() {

        it('should take an input, and return it on immediately', function() {
            var node = test.createComponent(factory);
            var vni = node.vni('');
            var input = 'un';
            sinon.stub(console,'log');
            var result = factory.updater.call(vni, input);
            console.log.restore();
            result.should.equal(input);
        });

        it('Given two distinct inputs, should undefined on the second input', function() {
            var node = test.createComponent(factory);
            var vni = node.vni('');
            var input1 = 'un';
            var input2 = 'deux';

            sinon.stub(console,'log');
            var result = factory.updater.call(vni, input1);
            result.should.equal(input1);

            result = factory.updater.call(vni, input2);
            console.log.restore();
            expect(result).to.be.undefined;
        });

        it('Should funnel two inputs, one at a time', function() {
            var node = test.createComponent(factory);
            var vni = node.vni('');
            var input1 = 'un';
            var input2 = 'deux';

            // Feed in first input
            sinon.stub(console,'log');
            var result = factory.updater.call(vni, input1);
            result.should.equal(input1);

            // Feed in second input
            result = factory.updater.call(vni, input2);
            expect(result).to.be.undefined;

            // Feed back the first input, indicating it is now done
            result = factory.updater.call(vni, input1);

            // Second input should now be popped off the queue and returned
            result.should.equal(input2);
            console.log.restore();
        });

        it('Should funnel three inputs, one at a time', function() {
            var node = test.createComponent(factory);
            var vni = node.vni('');
            var input1 = 'un';
            var input2 = 'deux';
            var input3 = 'trois';

            // Feed in first input
            sinon.stub(console,'log');
            var result = factory.updater.call(vni, input1);
            result.should.equal(input1);

            // Feed in second input
            result = factory.updater.call(vni, input2);
            expect(result).to.be.undefined;

            // Feed in third input
            result = factory.updater.call(vni, input3);
            expect(result).to.be.undefined;

            // Feed back the 1st input, indicating it is now done and verify we get 2nd input
            result = factory.updater.call(vni, input1);
            result.should.equal(input2);

            // Feed back the 2nd input, indicating it is now done and verify we get the 3rd input
            result = factory.updater.call(vni, input2);
            result.should.equal(input3);
            console.log.restore();
        });
    });

    describe('functional behavior', function() {

        it('should funnel an input with patientId metadata in a noflo network', function() {

            var input1 = 'un';
            var logBuffer;

            profiler.pipelineMetrics.totalDefaultVnis = 0;
            profiler.pipelineMetrics.totalVnis = 0;

            return test.createNetwork(
                 { funnel: 'rdf-components/funnel',
                   omega: 'core/Output'}

           ).then(function(network) {
                var funnel = network.processes.funnel.component;
                var omega = network.processes.omega.component;

                return new Promise(function(done, fail) {

                    test.onOutPortData(omega, 'out', done);
        
                    network.graph.addEdge('funnel', 'output', 'omega', 'in');

                    // sinon.stub(console,'log');
                    sinon.stub(console,'log', function(message) { 
                        logBuffer = _.isUndefined(logBuffer) ? message : logBuffer +  message;
                    });
                    network.graph.addInitial(input1, 'funnel', 'input');

                }).then(function(done) {
                    console.log.restore();

                    logBuffer.should.contain('Total VNIs: 1');
                    logBuffer.should.contain('Default VNIs: 1');

                    done.should.be.an('object');
                    test.verifyState(done, '', input1);
                    done.funnelId.should.exist;
                    done.funnelId.should.equal(input1);
                }, function(fail) {
                    console.error(fail);
                    console.log.restore();
                    throw Error(fail);
                }); 
            }); 
        });

        it('should funnel 2 inputs sequentially, updating patientId metadata in a noflo network', function() {

            var input1 = 'un';
            var input2 = 'deux';
            var logBuffer;
        
            profiler.pipelineMetrics.totalDefaultVnis = 0;
            profiler.pipelineMetrics.totalVnis = 0;

            return test.createNetwork(
                 { funnel: 'rdf-components/funnel',
                   extractPatientId: 'objects/ExtractProperty'}

           ).then(function(network) {
                var funnel = network.processes.funnel.component;
                var extractPatientId = network.processes.extractPatientId.component;

                return new Promise(function(done, fail) {

                    test.onOutPortData(extractPatientId, 'out', done);
        
                    network.graph.addEdge('funnel', 'output', 'extractPatientId', 'in');
                    network.graph.addEdge('extractPatientId', 'out', 'funnel', 'input');

                    sinon.stub(console,'log', function(message) { 
                        logBuffer = _.isUndefined(logBuffer) ? message : logBuffer +  message;
                    });
                    sinon.stub(logger,'warn');
                    network.graph.addInitial('patientId', 'extractPatientId', 'key');
                    network.graph.addInitial('patientId', 'funnel', 'metadata_key');
                    network.graph.addInitial(input1, 'funnel', 'input');

                }).then(function(done) {
                    done.should.equal(input1);
                    return new Promise(function(done2) {
                        test.onOutPortData(funnel, 'output', done2);
                        network.graph.addInitial(input2, 'funnel', 'input');
                    }).then(function(done2) {
                        console.log.restore();
                        logger.warn.restore();
                        logBuffer.should.contain('Total VNIs: 1');
                        logBuffer.should.contain('Default VNIs: 1');
                        test.verifyState(done2, '', input2);
                        done2.componentName.should.equal('rdf-components/funnel');
                        done2.patientId.should.equal(input2);
                    });
                }, function(fail) {
                    console.error(fail);
                    console.log.restore();
                    throw Error(fail);
                }); 
            }); 
        });
    });
});
