// file-loader-mocha.js

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var fs = require('fs');
var os = require('os');

var test = require('./common-test');
var factory = require('../components/file-loader');

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
               state.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
           });

           var result = factory.updater.call(node.vni(''), 'floadEnvVar', 'UTF-8');
           outPort.sendIt.restore();
           expect(result).to.be.undefined;
           numberOfSends.should.equal(3);
        });

    });

    describe('functional behavior', function() {

        it('should run in  a noflo network', function() {
            this.timeout(3000);
            var testfile = __dirname+"/data/ids.txt";
            process.env.floadEnvVar = testfile;

            return test.createNetwork(
                 { fileLoader: 'rdf-components/file-loader' }

           ).then(function(network) {
                // var filevar = network.processes.filevar.component;
                var fileLoader = network.processes.fileLoader.component;

                return new Promise(function(done, fail) {

                    test.onOutPortData(fileLoader, 'output', done);

                    // network.graph.addEdge('filevar', 'out', 'throttle', 'file_envvar');

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
});
