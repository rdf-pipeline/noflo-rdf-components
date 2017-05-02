// funnel-mocha.js

var _ = require('underscore');

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var os = require('os');

var format = require('../src/format');
var logger = require('../src/logger');
var profiler = require('../src/profiler');

var factory = require('../components/funnel');

var test = require('./common-test');

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
            var result = factory.updater.call(vni, input);
            result.should.equal(input);
        });

        it('Given two distinct inputs, should be undefined on the second input', function() {
            var node = test.createComponent(factory);
            var vni = node.vni('');
            var input1 = 'un';
            var input2 = 'deux';

            var result = factory.updater.call(vni, input1);
            result.should.equal(input1);

            result = factory.updater.call(vni, input2);
            expect(result).to.be.undefined;
        });

        it('Should funnel two inputs, one at a time', function() {
            var node = test.createComponent(factory);
            var vni = node.vni('');
            var input1 = 'un';
            var input2 = 'deux';

            // Feed in first input
            var result = factory.updater.call(vni, input1);
            result.should.equal(input1);

            // Feed in second input
            result = factory.updater.call(vni, input2);
            expect(result).to.be.undefined;

            // Feed back the first input, indicating it is now done
            result = factory.updater.call(vni, input1);

            // Second input should now be popped off the queue and returned
            result.should.equal(input2);
        });

        it('Should funnel three inputs, one at a time', function() {
            var node = test.createComponent(factory);
            var vni = node.vni('');
            var input1 = 'un';
            var input2 = 'deux';
            var input3 = 'trois';

            // Feed in first input
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
        });

        it('Should not queue the same input twice', function() {
            var node = test.createComponent(factory);
            var vni = node.vni('');
            var input1 = 'uno';
            var input2 = 'dos';
            var input3 = 'tres';

            logger.silence('warn');

            var result = factory.updater.call(vni, input1);
            result.should.equal(input1);

            result = factory.updater.call(vni, input1);
            expect(result).to.be.undefined;

            result = factory.updater.call(vni, input2);
            result.should.equal(input2);

            result = factory.updater.call(vni, input1);
            expect(result).to.be.undefined;

            result = factory.updater.call(vni, input2);
            expect(result).to.be.undefined;

            result = factory.updater.call(vni, input3);
            result.should.equal(input3);

            result = factory.updater.call(vni, input1);
            expect(result).to.be.undefined;

            result = factory.updater.call(vni, input2);
            expect(result).to.be.undefined;

            result = factory.updater.call(vni, input3);
            expect(result).to.be.undefined;
 
            logger.verbose('warn');
        });
    });

    describe('functional behavior', function() {

        it('should funnel an input with patientId metadata in a noflo network', function() {
	    this.timeout(3000);

            var input1 = 'un';
            var logBuffer;

            profiler.pipelineMetrics.totalDefaultVnis = 0;
            profiler.pipelineMetrics.totalVnis = 0;

            return test.createNetwork(
                 {funnel: 'rdf-components/funnel'}

           ).then(function(network) {
                var funnel = network.processes.funnel.component;

                return new Promise(function(done, fail) {

                    test.onOutPortData(funnel, 'output', done);
                    test.onOutPortData(funnel, 'error', fail);

                    sinon.stub(logger,'info').callsFake(function(message) { 
                        logBuffer = _.isUndefined(logBuffer) ? message : logBuffer +  message;
                    });
                    network.graph.addInitial(input1, 'funnel', 'input');

                }).then(function(done) {
                    logger.info.restore();

                    logBuffer.should.contain('Total VNIs: 1');
                    logBuffer.should.contain('Default VNIs: 1');

                    done.should.be.an('object');
                    test.verifyState(done, '', input1);
                    done.funnelId.should.exist;
                    done.funnelId.should.equal(input1);
                }, function(fail) {
                    logger.info.restore();
                    logger.error(fail);
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
                    test.onOutPortData(funnel, 'error', fail);
        
                    network.graph.addEdge('funnel', 'output', 'extractPatientId', 'in');
                    network.graph.addEdge('extractPatientId', 'out', 'funnel', 'input');

                    sinon.stub(logger,'info').callsFake(function(message) { 
                        logBuffer = _.isUndefined(logBuffer) ? message : logBuffer +  message;
                    });
                    network.graph.addInitial('patientId', 'extractPatientId', 'key');
                    network.graph.addInitial('patientId', 'funnel', 'metadata_key');
                    network.graph.addInitial(input1, 'funnel', 'input');

                }).then(function(done) {
                    done.should.equal(input1);
                    return new Promise(function(done2) {
                        test.onOutPortData(funnel, 'output', done2);
                        network.graph.addInitial(input2, 'funnel', 'input');
                    }).then(function(done2) {
                        logBuffer.should.contain('Total VNIs: 1');
                        logBuffer.should.contain('Default VNIs: 1');
                        test.verifyState(done2, '', input2);
                        done2.componentName.should.equal('rdf-components/funnel');
                        done2.patientId.should.equal(input2);
                    });
                }, function(fail) {
                    logger.error(fail);
                    throw Error(fail);
                }); 
            }); 
        });
    });

    describe('memory testing', function() {

        it('heap should not grow', function(done) {

            // verify we can control garbage collection for this test.
            if (_.isUndefined(global.gc)) {
                console.warn('        skipping heap growth test; run with --expose-gc');
                return done();
            }

            return test.createNetwork(
                 { funnel: 'rdf-components/funnel'}

            ).then(function(network) {
                var funnel = network.processes.funnel.component;

                var max = 50;
                var inputs = [];
                for (var i=0; i < max; i++) {
                    inputs.push(i);
                }

                var count = 0;
                var validator = function(result) {
                    // validate the funnel returned what we expect
                    result.should.be.an('object');
                    result.vnid.should.equal('');
                    result.data.should.equal(count.toString());
                    expect(result.error).to.be.undefined;
                    result.componentName.should.equal('rdf-components/funnel');
                    result.patientId.should.equal(result.data);
                    result.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);

                    // Notify the funnel we are done processing this one
                    network.graph.addInitial(result.data, 'funnel', 'input');
                    count++;
                };

                // Build a list of promises to execute a file-loader component request
                var promiseFactories =  _.map(inputs, function(input, i) {
                    var payload = (i == 0) ? [{payload: input.toString(), componentName: 'funnel', portName: 'input'},
                                               {payload: 'patientId', componentName: 'funnel', portName: 'metadata_key'}]
                                               : [{payload: input.toString(), componentName: 'funnel', portName: 'input'}];
                    return test.executePromise.bind(test, network, funnel, payload, validator);
                });

                // Garbage collect & get initial heap use
                global.gc();
                var initHeap = process.memoryUsage().heapUsed;
                var initFreeMem = os.freemem();

                // Execute our calls to funnel, one at a time
                return Promise.resolve(test.executeSequentially(promiseFactories)).then(function() {

                    // wait until the funnel receives the last completion message from validator and completes
                    setTimeout(function() {

                       // run garbage collection
                       global.gc();

                       // check to see if the heap has grown or not
                       var finishHeap = process.memoryUsage().heapUsed;
                       var heapDelta = finishHeap - initHeap;
                       if (heapDelta > 0) {
                           logger.error('        Funnel component heap grew!  After ' + max + 
                                        ' executions, heap difference=' + format.bytesToMb(heapDelta));
                           heapDelta.should.not.be.greaterThan(0);
                       }
 
                       // check whether our free memory has decreased
                       var finishMem = os.freemem();
                       var freeMemDelta = finishMem - initFreeMem;
                       if (freeMemDelta < 0) {
                           logger.error('        O/S Free memory decreased!  After ' + max + 
                                        ' executions, free memory difference=' + format.bytesToMb(-freeMemDelta));
                           freeMemDelta.should.not.be.lessThan(0);
                       }

                       done();
                    }, 200);
               });

            });
        });

    });
});
