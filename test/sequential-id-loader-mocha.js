// sequential-id-loader-mocha.js

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

var _ = require('underscore');
var fs = require('fs');
var os = require('os');

var factory = require('../components/sequential-id-loader');

var logger = require('../src/logger');
var test = require('./common-test');

describe('seqential-id-loader', function() {

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
                "Sequential file loader requires a file environment variable with file to load!");
        });

        it("should throw an error if no file env var exists", function() {
            var node = test.createComponent(factory);
            expect(factory.updater.bind(node.vni(''), "fileEnvVar")).to.throw(Error,
                'Sequential file loader environment variable "fileEnvVar" does not contain a file name!');
        });

        it("should throw an error if file env var is empty", function() {
            var node = test.createComponent(factory);
            process.env.fileEnvVar = '';
            expect(factory.updater.bind(node.vni(''), "fileEnvVar")).to.throw(Error,
                'Sequential file loader environment variable "fileEnvVar" does not contain a file name!');
        });

        it("should read and return first line of file specified in file_envvar input with utf8 encoding", function() {

            var node = test.createComponent(factory);
            vni = node.vni('');
            var envvar = "fileEnvVar";
            process.env[envvar] = __dirname + '/data/ids.txt';
            var id = factory.updater.call(vni, envvar, 'utf8');
            id.should.equal('1');
        }); 

        it("should read and return each line of file specified in file_envvar input in sequential order", function() {

            var node = test.createComponent(factory);
            vni = node.vni('');

            var envvar = "fileEnvVar";
            process.env[envvar] = __dirname + '/data/ids.txt';

            expect(factory.updater.call(vni, envvar)).to.equal('1');
            expect(factory.updater.call(vni, envvar)).to.equal('2');
            expect(factory.updater.call(vni, envvar)).to.equal('3');
            expect(factory.updater.call(vni, envvar)).to.be.undefined; // no more data
        }); 

    }); // describe updater

    describe('functional behavior', function() {

        it('should run in  a noflo network using defaults', function() {

            var envvar = "fileEnvVar";
            process.env[envvar] = __dirname + '/data/ids.txt';

            return test.createNetwork(
                {seqIdLoader: 'rdf-components/sequential-id-loader'}

            ).then(function(network) {

                var seqIdLoader = network.processes.seqIdLoader.component;

                return new Promise(function(done, fail) {
                    test.onOutPortData(seqIdLoader, 'output', done);

                    network.graph.addInitial(envvar, 'seqIdLoader', 'file_envvar');

                }).then(function(result) {
                    test.verifyState(result, '1', '1')
                });
            }).catch(function(e) {
                var msg = "Sequential file loader failed in a network"+e;
                console.error(msg);
                throw Error(msg);
            });
        });

        it('should run in  a noflo network using default VNI if flag is set', function() {

            var envvar = "fileEnvVar";
            process.env[envvar] = __dirname + '/data/ids.txt';

            return test.createNetwork(
                {seqIdLoader: 'rdf-components/sequential-id-loader'}

            ).then(function(network) {

                var seqIdLoader = network.processes.seqIdLoader.component;

                return new Promise(function(done, fail) {
                    test.onOutPortData(seqIdLoader, 'output', done);

                    network.graph.addInitial(envvar, 'seqIdLoader', 'file_envvar');
                    network.graph.addInitial('utf8', 'seqIdLoader', 'encoding');
                    network.graph.addInitial(true, 'seqIdLoader', 'use_default_vni');

                }).then(function(result) {
                    test.verifyState(result, '', '1')
                });
            }).catch(function(e) {
                var msg = "Sequential file loader failed in a network"+e;
                console.error(msg);
                throw Error(msg);
            });
        });

        it('should run in  a noflo network setting the metadata key', function() {

            var envvar = "fileEnvVar";
            process.env[envvar] = __dirname + '/data/ids.txt';

            var metadataKey = 'patientId';

            return test.createNetwork(
                {seqIdLoader: 'rdf-components/sequential-id-loader'}

            ).then(function(network) {

                var seqIdLoader = network.processes.seqIdLoader.component;

                return new Promise(function(done, fail) {
                    test.onOutPortData(seqIdLoader, 'output', done);

                    network.graph.addInitial(envvar, 'seqIdLoader', 'file_envvar');
                    network.graph.addInitial(metadataKey, 'seqIdLoader', 'metadata_key');

                }).then(function(result) {
                    test.verifyState(result, '1', '1')
                    result[metadataKey].should.exist;
                    result[metadataKey].should.equal('1');
                });
            }).catch(function(e) {
                var msg = "Sequential file loader failed in a network"+e;
                console.error(msg);
                throw Error(msg);
            });
        });

        it('should run in  a noflo network cycling through Ids in a round trip pipeline', function() {

            var envvar = "fileEnvVar";
            process.env[envvar] = __dirname + '/data/ids.txt';

            var metadataKey = 'patientId';
            var verifyResult = function(result, expectedVnid, expectedData) {
                    test.verifyState(result, expectedVnid, expectedData)
                    result[metadataKey].should.exist;
                    result[metadataKey].should.equal(expectedData);
            }

            return test.createNetwork(
                {seqIdLoader: 'rdf-components/sequential-id-loader'}

            ).then(function(network) {

                var seqIdLoader = network.processes.seqIdLoader.component;

                return new Promise(function(done, fail) {
                    test.onOutPortData(seqIdLoader, 'output', done);

                    network.graph.addInitial(envvar, 'seqIdLoader', 'file_envvar');
                    network.graph.addInitial(metadataKey, 'seqIdLoader', 'metadata_key');

                }).then(function(result) {
                    verifyResult(result, '1', '1');

                    // now kick it 
                    return new Promise(function(done, fail) {
                        test.onOutPortData(seqIdLoader, 'output', done);
                        network.graph.addInitial('kick', 'seqIdLoader', 'kick');
                    }).then(function(result) { 
                        verifyResult(result, '2', '2');
                    });
                });
            }).catch(function(e) {
                var msg = "Sequential file loader failed in a network"+e;
                console.error(msg);
                throw Error(msg);
            });
        });

    });
});

