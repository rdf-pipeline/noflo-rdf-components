// exec-command-mocha.js

var _ = require('underscore');
var fs = require('fs');

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var fs = require('fs');
var os = require('os');

var test = require('./common-test');
var factory = require('../components/exec-command');

describe('exec-command', function() {

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

        it('should throw an error if a command is not specified', function() {
            expect(factory.updater.bind(this, undefined)).to.throw(Error,
                /Execute command component requires a command to execute!/);
        });

        it('should execute a simple command', function() {
            var node = test.createComponent(factory);
            var vni = node.vni('');

            return new Promise(function(resolve, fail) {

                var result = factory.updater.call(vni, 'date');
                resolve(result);

            }).then(function(result) {
                expect(result.error).to.be.null;
                result.stderr.should.have.length(0);
                expect(Date.parse(result.stdout)).to.be.greaterThan(0);

            }, function(fail) { 
                assert.fail("Unable to execute date command", fail);
            });
        });

        it('should execute a command with arguments', function() {

            var node = test.createComponent(factory);
            var vni = node.vni('');

            var tmpDir = os.tmpdir();
            var filepath =  tmpDir + "/test-command" + Math.random() + ".txt"
            fs.writeFileSync(filepath, "Testing command execution");

            return new Promise(function(resolve, fail) {

                var result = factory.updater.call(vni, 'ls', '-ltr', tmpDir + '/*.txt');
                resolve(result);

            }).then(function(result) {

                expect(result.error).to.be.null;
                result.stderr.should.have.length(0);
                result.stdout.should.contain(filepath);
                fs.unlinkSync(filepath);

            }, function(fail) {
                fs.unlinkSync(filepath);
                assert.fail("Unable to write string to file:", fail);
            });
	});

        it('should return command errors', function() {

            var node = test.createComponent(factory);
            var vni = node.vni('');

            var unknownDir =  os.tmpdir() + "/test-command-dir" + Math.random() + Math.random(); 

            return new Promise(function(resolve, fail) {

                var result = factory.updater.call(vni, 'ls', undefined, unknownDir);
                resolve(result);

            }).then(function(result) {

                result.error.code.should.equal(1);
                result.stdout.should.have.length(0);
                result.stderr.should.contain(unknownDir);

            }, function(fail) {
                assert.fail("Unable to write string to file:", fail);
            });
	});

    });

    describe('functional behavior', function() {

        it('should execute commands in a noflo network', function() {

            return test.createNetwork(
                 {exec_cmd: 'rdf-components/exec-command'}

           ).then(function(network) {
                var execCmd = network.processes.exec_cmd.component;

                return new Promise(function(done, fail) {

                    test.onOutPortData(execCmd, 'output', done);
                    test.onOutPortData(execCmd, 'error', fail);
        
                    network.graph.addInitial('ls', 'exec_cmd', 'command');
                    network.graph.addInitial('-l', 'exec_cmd', 'optional_args');
                    network.graph.addInitial(os.tmpdir(), 'exec_cmd', 'positional_args');

                }).then(function(done) {

                    done.should.be.an('object');
                    done.should.include.keys('vnid', 'lm','data','error','stale', 'groupLm');
                    done.vnid.should.equal('');

                    done.data.should.be.an('object');
                    done.data.should.have.all.keys('error', 'stdout', 'stderr');
                    expect(done.data.error).to.be.null;
                    done.data.stderr.should.be.empty;
                    done.data.stdout.should.not.be.empty;

                }, function(fail) {
                    console.error(fail);
                    throw Error(fail);
                }); 
            }); 
        });

    });
});
