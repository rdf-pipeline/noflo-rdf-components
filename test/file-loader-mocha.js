// file-loader-mocha.js

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var _ = require('underscore');
var fs = require('fs');
var os = require('os');

var factory = require('../components/file-loader');

var format = require('../src/format');
var logger = require('../src/logger');

var test = require('./common-test');

describe('file-loader', function() {

    it("should exist as a function", function() {
        factory.should.exist;
        factory.should.be.a('function');
    });

    it("should instantiate a noflo component", function() {
        var node = test.createComponent(factory);
        node.should.be.an('object');
        node.should.include.keys('nodeName', 'componentName', 'outPorts', 'inPorts', 'vni', 'vnis');
    });

    describe('#updater', function() {

        it("should throw an error if no arguments specified", function() {
            var node = test.createComponent(factory);
            expect(factory.updater.bind(node.vni(''))).to.throw(Error,
                /File-loader requires a file environment variable with file to load!/);
        });

        it("should throw an error if no file_envvar  was specified", function() {
            var node = test.createComponent(factory);
            expect(factory.updater.bind(node.vni(''), undefined, 'UTF-8')).to.throw(Error,
                /File-loader requires a file environment variable with file to load!/);
        });

        it("should throw an error if file_envvar environment variable does not exist", function() {
            var node = test.createComponent(factory);
            expect(factory.updater.bind(node.vni(''), 'floadEnvVar')).to.throw(Error,
                "File-loader environment variable floadEnvVar is not defined!");
        });

        it("should throw an error if file_envvar does not contain path to an  existing file", function() {
            var node = test.createComponent(factory);
            process.env.floadEnvVar = '/tmp/Non-existent-file.txt';
            expect(factory.updater.bind(node.vni(''), 'floadEnvVar')).to.throw(Error,
                   "ENOENT: no such file or directory, open '/tmp/Non-existent-file.txt'");
        });

        it("should log a warning if file_envvar referenced file has no content", function() {
            var testfile = os.tmpdir() + './testfile.txt';
            fs.writeFile(testfile, '', function() { 
                process.env.floadEnvVar = testfile;
                var node = test.createComponent(factory);
                
                var warning;
                sinon.stub(logger,'warn', function(message) {
                    warning = message;
                });
                var result = factory.updater.call(node.vni(''), 'floadEnvVar');
                logger.warn.restore();
		warning.should.be.a('string');
		warning.should.equal("No data found in " + process.env.floadEnvVar);
           });
        });

        it("should send records on output port and return nothing", function() {
           var node = test.createComponent(factory);
           var testfile = __dirname+"/data/ids.txt";
           process.env.floadEnvVar = testfile;

           var outPort = node.outPorts.output;
           var numberOfSends = 0;
           sinon.stub(outPort,'sendIt', function(state) {
               numberOfSends++;
               state.should.be.an('object');
               state.vnid.should.equal(numberOfSends.toString());
               state.data.should.equal(numberOfSends.toString());
               expect(state.error).to.be.undefined;
               expect(state.stale).to.be.undefined;
               expect(state.groupLm).to.be.undefined;
               expect(state.id).to.be.undefined;
               state.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
           });

           var result = factory.updater.call(node.vni(''), 'floadEnvVar', 'UTF-8');
           outPort.sendIt.restore();
           expect(result).to.be.undefined;
           numberOfSends.should.equal(3);
        });

        it("should use default VNI for sequential sending when configured to do so", function() {
           var node = test.createComponent(factory);
           var testfile = __dirname+"/data/ids.txt";
           process.env.floadEnvVar = testfile;

           var result = factory.updater.call(node.vni(''), 'floadEnvVar', 'UTF-8', true);
           result.should.equal('1');
           var outputState = node.vni('').outputState();
           outputState.vnid.should.equal('');
           expect(outputState.error).to.be.undefined;
           expect(outputState.stale).to.be.undefined;
           expect(outputState.groupLm).to.be.undefined;
           outputState.id.should.equal('1');

           result = factory.updater.call(node.vni(''), 'floadEnvVar', 'UTF-8', true, 'patientId');
           result.should.equal('2');
           outputState = node.vni('').outputState();
           outputState.vnid.should.equal('');
           expect(outputState.error).to.be.undefined;
           expect(outputState.stale).to.be.undefined;
           expect(outputState.groupLm).to.be.undefined;
           outputState.patientId.should.equal('2');
        });

        it("should set specified metadata key", function() {
           var node = test.createComponent(factory);
           var testfile = __dirname+"/data/ids.txt";
           process.env.floadEnvVar = testfile;

           var outPort = node.outPorts.output;
           var numberOfSends = 0;
           sinon.stub(outPort,'sendIt', function(state) {
               numberOfSends++;
               state.should.be.an('object');
               state.vnid.should.equal(numberOfSends.toString());
               state.data.should.equal(numberOfSends.toString());
               state.patientId.should.equal(numberOfSends.toString());
               expect(state.error).to.be.undefined;
               expect(state.stale).to.be.undefined;
               expect(state.groupLm).to.be.undefined;
               state.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
           });

           var result = factory.updater.call(node.vni(''), 'floadEnvVar', 'UTF-8', false, 'patientId');
           outPort.sendIt.restore();
           expect(result).to.be.undefined;
           numberOfSends.should.equal(3);
        });
    });

    describe('functional behavior', function() {

        it('should run in  a noflo network', function() {
            this.timeout(3250);
            var testfile = __dirname+"/data/ids.txt";
            process.env.floadEnvVar = testfile;

            return test.createNetwork(
                 { fileLoader: 'rdf-components/file-loader' }

           ).then(function(network) {
                var fileLoader = network.processes.fileLoader.component;

                return new Promise(function(done, fail) {

                    test.onOutPortData(fileLoader, 'output', done);
                    network.graph.addInitial('floadEnvVar', 'fileLoader', 'file_envvar');

                }).then(function(done) {
                    done.should.be.an('object');
                    done.should.include.keys('vnid', 'lm','data','error','stale', 'groupLm');
                    done.vnid.should.equal('1');
                    done.data.should.equal('1');
                    expect(done.error).to.be.undefined;
                    expect(done.stale).to.be.undefined;
                    var lmComponents = done.lm.match(/^LM(\d+)\.(\d+)$/);
                    lmComponents.should.have.length(3);
                });
            }); 
        });

    });
    describe('memory testing', function() {

        it("updater should not grow the heap", function(done) {

            // verify we can control garbage collection for this test.
            if (_.isUndefined(global.gc)) {
                console.warn('        skipping heap growth test; run with --expose-gc');
                return done();
            }

            this.timeout(10000);
            return test.createNetwork(
                 { fileLoader: 'rdf-components/file-loader'}

            ).then(function(network) {
                var fileLoader = network.processes.fileLoader.component;

                var paths = [];
                var max = 20;
                var heapfile, hd;

                // Create the files to test with
                for (var i=0; i < max; i++) {
                    var path = '/tmp/fct-testFile'+i+'.txt';
                    fs.writeFileSync(path, i + '\n' + (i+1) +'\n' + (i+2) + '\n' + (i+3) + '\n');
                    paths.push(path);
                }

                // Define a validator for file-loader results to be sure it's running OK
                var envPrefix = 'floadEnvVar';
                var count = 0;
                var validator = function(result, inputs) {
                   
                    if (result.vnid !== '1') 
                        throw Error('File loader returned unexpected result: ',result);

                    result.data.should.equal(count.toString());
                    var envvar = envPrefix + count;
                    inputs[0].payload.should.equal(envvar);
                    process.env[envvar].should.equal(paths[count]); 
                    count++;

                    return;
                };

                global.gc(); // force garbage collection

                // Get initial memory level
                var initFreeMem = os.freemem();
                var initHeap = process.memoryUsage().heapUsed;

                // Build a list of promises to execute a file-loader component request
                var promiseFactories =  _.map(paths, function(path, i) {
                    var envvar = envPrefix+i;
                    process.env[envvar] = paths[i];
                    return test.executePromise.bind(test, network, fileLoader,
                                        [{payload: envvar,
                                          componentName: 'fileLoader',
                                          portName: 'file_envvar'}],
                                        validator);
                });

                // Execute our 100 calls to funnel, one at a time
                return Promise.resolve(test.executeSequentially(promiseFactories)).then(function(results) {
                       global.gc();

                       // check to see if the heap has grown or not
                       var finishHeap = process.memoryUsage().heapUsed;
                       var heapDelta = finishHeap - initHeap;
                       if (heapDelta > 0) {
                           logger.error('\n        Component heap grew after a run with ' + max +
                                         ' component calls!  Heap difference=' + format.bytesToMb(heapDelta));
                           heapDelta.should.not.be.greaterThan(0);
                       }

                       // check whether our free memory has decreased
                       var finishMem = os.freemem();
                       var freeMemDelta = finishMem - initFreeMem;
                       if (freeMemDelta < 0) {
                           logger.error('\n        O/S Free memory decreased after a run with ' + max +
                                         ' component calls!  Free memory difference=' + format.bytesToMb(-freeMemDelta));
                           freeMemDelta.should.not.be.lessThan(0);
                       }

                       // clean up 
                       paths.forEach(function(path, index) {
                           fs.unlinkSync(path);
                           delete process.env[envPrefix+index];
                       });

                       done();
                });

            });
        });
    });
});
