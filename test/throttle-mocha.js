// throttle-mocha.js
// throttle component tests

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var fs = require('fs');
var os = require('os');

var test = require('./common-test');
var factory = require('../components/throttle');
var logger = require('../src/logger');

describe('throttle', function() {

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
                /Throttle requires an environment variable file_envvar to specify the data to process!/);
        });

        it("should throw an error if no file_envvar  was specified", function() {
            var node = test.createComponent(factory);
            expect(factory.updater.bind(node.vni(''), 3, undefined)).to.throw(Error,
                /Throttle requires an environment variable file_envvar to specify the data to process!/);
        });

        it("should throw an error if file_envvar environment variable does not exist", function() {
            var node = test.createComponent(factory);
            expect(factory.updater.bind(node.vni(''), 3, 'throttleEnvVar')).to.throw(Error,
                "Throttle environment variable throttleEnvVar is not defined!");
        });

        it("should throw an error if file_envvar does not contain path to an  existing file", function() {
            var node = test.createComponent(factory);
            process.env.throttleEnvVar = '/tmp/Non-existent-file.txt';
            expect(factory.updater.bind(node.vni(''), 3, 'throttleEnvVar')).to.throw(Error,
                   "ENOENT: no such file or directory, open '/tmp/Non-existent-file.txt'");
        });

        it("should log a warning if file_envvar referenced file has no content", function() {
            var testfile = os.tmpdir() + './testfile.txt';
            fs.writeFile(testfile, '', function() { 
                process.env.throttleEnvVar = testfile;
                var node = test.createComponent(factory);
                
                var warning;
                sinon.stub(logger,'warn').callsFake(function(message) {
                    warning = message;
                });
                var result = factory.updater.call(node.vni(''), "1", 'throttleEnvVar');
                logger.warn.restore();
		warning.should.be.a('string');
		warning.should.equal("No data found in " + process.env.throttleEnvVar);
           });
        });

        it("should output a hash of throttle_size", function() {
           var node = test.createComponent(factory);
           var testfile = __dirname+"/data/ids.txt";
           process.env.throttleEnvVar = testfile;
           var result = factory.updater.call(node.vni(''), "2", 'throttleEnvVar', 'UTF-8');
           result.should.not.be.empty;
           result.should.deep.equal({'1':'1', '2':'2'});
        });

        it("should default to hash size of 1 if no hash size is specified", function() {
           var node = test.createComponent(factory);
           var testfile = __dirname+"/data/ids.txt";
           process.env.throttleEnvVar = testfile;
           var result = factory.updater.call(node.vni(''), undefined, 'throttleEnvVar');
           result.should.not.be.empty;
           result.should.deep.equal({'1':'1'});
        });

    });

    describe('functional behavior', function() {

        it('should run in  a noflo network', function() {
            this.timeout(3000);
            var testsize = 1;
            var testfile = __dirname+"/data/ids.txt";
            process.env.throttleEnvVar = testfile;

            return test.createNetwork(
                 { filevar: 'core/Repeat',
                   throttlesize: 'core/Repeat',
                   throttle: 'rdf-components/throttle' }

           ).then(function(network) {
                var filevar = network.processes.filevar.component;
                var throttlesize = network.processes.throttlesize.component;
                var throttle = network.processes.throttle.component;

                return new Promise(function(done, fail) {

                    test.onOutPortData(throttle, 'output', done);

                    network.graph.addEdge('filevar', 'out', 'throttle', 'file_envvar');
                    network.graph.addEdge('throttlesize', 'out', 
                                          'throttle', 'throttle_size');

                    network.graph.addInitial('throttleEnvVar', 'filevar', 'in');
                    network.graph.addInitial(testsize, 'throttlesize', 'in');

                }).then(function(done) {
                    done.should.be.an('object');
                    done.vnid.should.equal('1');
                    done.data.should.equal('1');
                    expect(done.error).to.be.undefined;
                    expect(done.stale).to.be.undefined;
                });
            }); 
        });

    });
});
