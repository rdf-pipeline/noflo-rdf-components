// id-hash-mapper-mocha.js

var chai = require('chai');

var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var _ = require('underscore');
var fs = require('fs');
var os = require('os');

var test = require('./common-test');
var factory = require('../components/id-hash-mapper');

describe('id-mapper', function() {

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

        it('should throw an error if id is undefined', function() {
            expect(factory.updater.bind(this, undefined)).to.throw(Error, 
                /Id hash mapper component requires an id to map!/);
        }); 

        it("should throw an error if no mapfile environment varable was specified", function() {
            var node = test.createComponent(factory);
            expect(factory.updater.bind(node.vni(''), '1', undefined, 'UTF-8')).to.throw(Error,
                /Id hash mapper component requires a map file environment variable with a file to load!/);
        });

        it("should throw an error if the map file environment variable does not reference an existing file", function() {
            var node = test.createComponent(factory);
            process.env.mapFileEnvVar = '/tmp/Non-existent-file.txt';
            expect(factory.updater.bind(node.vni(''), '1', 'mapFileEnvVar')).to.throw(Error,
                   "ENOENT: no such file or directory, open '/tmp/Non-existent-file.txt'");
        });

        it("should log a warning if the map file environment variable referenced file has no content", function() {
            var testfile = os.tmpdir() + './testfile.txt';
            fs.writeFile(testfile, '', function() {
                process.env.mapFileEnvVar = testfile;
                var node = test.createComponent(factory);

                var warning;
                sinon.stub(logger,'warn', function(message) {
                    warning = message;
                });
                var result = factory.updater.call(node.vni(''), '1', 'mapFileEnvVar');
                logger.warn.restore();
                warning.should.be.a('string');
                warning.should.equal("No data found in " + process.env.mapFileEnvVar);
           });
        });

        it("should map to a new id even if the json pointer and input are empty", function() { 
            var node = test.createComponent(factory);
            process.env.mapFileEnvVar = __dirname + '/data/id-hash-map.json';

            var result = factory.updater.call(node.vni(''), '1', 'mapFileEnvVar');
            result.should.equal('F-5');
        });

        it("should map to a new id using a single json pointer and input to control the id pool", function() { 
            var node = test.createComponent(factory);
            process.env.mapFileEnvVar = __dirname + '/data/id-hash-map.json';

            // get simple test patient data
            var testFile = __dirname + '/data/chcs-patient7.jsonld';
            var data = fs.readFileSync(testFile);
            var input = JSON.parse(data);
 
            var jsonPtr = '[ "/@graph/0/sex-2/label" ]';

            var result = factory.updater.call(node.vni(''), 
                                              '1', 'mapFileEnvVar',
                                              input, jsonPtr );
            result.should.equal('M-2');
        });
 
        it("should map to a new id using a multi-element array of json pointers and input to control the id pool", function() { 
            var node = test.createComponent(factory);
            process.env.mapFileEnvVar = __dirname + '/data/id-hash-map.json';

            // get simple test patient data
            var testFile = __dirname + '/data/chcs-patient7.jsonld';
            var data = fs.readFileSync(testFile);
            var input = JSON.parse(data);
 
            var jsonPtrs = '[ "/@graph/0/sex-1/label",  "/@graph/0/sex-2/label", "/@graph/0/gender/label" ]';

            var result = factory.updater.call(node.vni(''), 
                                              '1', 'mapFileEnvVar',
                                              input, jsonPtrs );
            result.should.equal('M-2');
        });
 
        it("should map to a new id if json pointer is present, though input is not", function() { 
            var node = test.createComponent(factory);
            process.env.mapFileEnvVar = __dirname + '/data/id-hash-map.json';

            var jsonPtrs = '[ "/@graph/0/sex-1/label",  "/@graph/0/sex-2/label", "/@graph/0/gender/label" ]';

            var result = factory.updater.call(node.vni(''), 
                                              'ID-4', 'mapFileEnvVar',
                                               undefined, jsonPtrs );
            result.should.equal('M-3');
        });

        it("should map to a new id even if input is present, but json pointer is empty", function() { 
            var node = test.createComponent(factory);
            process.env.mapFileEnvVar = __dirname + '/data/id-hash-map.json';

            // get simple test patient data
            var testFile = __dirname + '/data/chcs-patient7.jsonld';
            var data = fs.readFileSync(testFile);
            var input = JSON.parse(data);
 
            var result = factory.updater.call(node.vni(''), 
                                              'PatientId-123', 'mapFileEnvVar',
                                              input, '' );
            result.should.equal('M-1');
        });

   });

   describe('functional behavior', function() {
       this.timeout(3000);

       it('should map an id using the hash in a noflo network', function() {
           return test.createNetwork(
                { readInputFile: 'filesystem/ReadFile',
                  parseJson: 'strings/ParseJson',
                  mapper: { getComponent: factory }
            }).then(function(network) {

                return new Promise(function(done, fail) {

                    // True noflo component - not facade
                    var readInputFile = network.processes.readInputFile.component;
                    var parseJson = network.processes.parseJson.component;
                    var mapper = network.processes.mapper.component;

                    test.onOutPortData(mapper, 'output', done);
                    test.onOutPortData(mapper, 'error', fail);

                    process.env.mapFileEnvVar = __dirname + '/data/id-hash-map.json';

                    network.graph.addEdge('readInputFile', 'out', 'parseJson', 'in');
                    network.graph.addEdge('parseJson', 'out', 'mapper', 'input');

                    var testFile = __dirname + '/data/chcs-patient8.jsonld';
                    network.graph.addInitial(testFile, 'readInputFile', 'in');

		    network.graph.addInitial('2-000008', 'mapper', 'id');
		    network.graph.addInitial('[ "/@graph/0/sex-2/label" ]',
                                             'mapper', 'json_pointers');


		    network.graph.addInitial('mapFileEnvVar', 'mapper', 'mapfile_envvar');

                }).then(function(done) {

                    test.verifyState(done, '', 'M-2');
                });
           });
       }); 

       it('should map multiple Ids in a noflo network', function() {
           return test.createNetwork(
                { readInputFile: 'filesystem/ReadFile',
                  parseJson: 'strings/ParseJson',
                  mapper: { getComponent: factory }
            }).then(function(network) {

                // True noflo component - not facade
                var readInputFile = network.processes.readInputFile.component;
                var parseJson = network.processes.parseJson.component;
                var mapper = network.processes.mapper.component;

                return new Promise(function(done, fail) {

                    test.onOutPortData(mapper, 'output', done);

                    process.env.mapFileEnvVar = __dirname + '/data/id-hash-map.json';

                    network.graph.addEdge('readInputFile', 'out', 'parseJson', 'in');
                    network.graph.addEdge('parseJson', 'out', 'mapper', 'input');

                    var testFile = __dirname + '/data/chcs-patient7.jsonld';
                    network.graph.addInitial(testFile, 'readInputFile', 'in'); 

                    network.graph.addInitial('2-000007', 'mapper', 'id');
                    network.graph.addInitial('[ "/@graph/0/sex-2/label" ]', 'mapper', 'json_pointers');

                    network.graph.addInitial('mapFileEnvVar', 'mapper', 'mapfile_envvar');

                }).then(function(done) {

                    test.verifyState(done, '', 'M-3');

                    return new Promise(function(done2, fail2) {

                        // Now that we've processed one patient, try processing the next 
                        test.onOutPortData(mapper, 'output', done2);
                        network.graph.addInitial('2-000008', 'mapper', 'id');
 
                        var testFile2 = __dirname + '/data/chcs-patient8.jsonld';
                        network.graph.addInitial(testFile2, 'readInputFile', 'in'); 

                    }).then(function(done2) {

                        test.verifyState(done, '', 'M-2');
                    });

                });
           });
       }); 

   });
});
