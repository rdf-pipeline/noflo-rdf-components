// id-hash-mapper-mocha.js

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var fs = require('fs');
var os = require('os');

var test = require('./common-test');
var factory = require('../components/id-hash-mapper');
var logger = require('../src/logger');

describe('id-hash-mapper', function() {

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
                /Id hash mapper component requires an id to map!/);
        });

        it("should throw an error if no file_envvar  was specified", function() {
            var node = test.createComponent(factory);
            expect(factory.updater.bind(node.vni(''), '1', undefined)).to.throw(Error,
                /Id hash mapper component requires a file environment variable with file to load!/);
        });

        it("should throw an error if file_envvar environment variable does not exist", function() {
            var node = test.createComponent(factory);
            expect(factory.updater.bind(node.vni(''), '1', 'mapFileEnvVar')).to.throw(Error,
                "Id hash mapper component environment variable mapFileEnvVar is not defined!");
        });

        it("should throw an error if file_envvar does not contain path to an  existing file", function() {
            var node = test.createComponent(factory);
            process.env.mapFileEnvVar = '/tmp/Non-existent-file.txt';
            expect(factory.updater.bind(node.vni(''), '1', 'mapFileEnvVar')).to.throw(Error,
                   "ENOENT: no such file or directory, open '/tmp/Non-existent-file.txt'");
        });

        it("should log a warning if file_envvar referenced file has no content", function() {
            var testfile = '/tmp/test-no-content.txt';
            fs.writeFileSync(testfile, '');
            process.env.mapFileEnvVar = testfile;

            var node = test.createComponent(factory);
                
            var warning;
            sinon.stub(logger,'warn', function(message) {
                warning = message;
            });
            var result = factory.updater.call(node.vni(''), '1', 'mapFileEnvVar');
            logger.warn.restore();

            warning.should.be.a('string');
            warning.should.equal("No data found in /tmp/test-no-content.txt");
        });

        it("should throw an error if there are no ids in the hash map", function() {

            var testfile = '/tmp/test-no-hash-ids.txt';
            fs.writeFileSync(testfile, '{"female": [], "other": []}');
            process.env.mapFileEnvVar = testfile;
            var node = test.createComponent(factory);
            expect(factory.updater.bind(node.vni(''), '1', 'mapFileEnvVar')).to.throw(Error,
                /Id hash mapper component requires at least one id in the mapFileEnvVar file!/);

        });

        it("should retrieve an id from the hashmap given an id and hashmap file", function() {
           var node = test.createComponent(factory);
           var testfile = __dirname+"/data/hash-map-ids.txt";
           process.env.mapFileEnvVar = testfile;

           // verify empty string works
           var result0 = factory.updater.call(node.vni(''), '', 'mapFileEnvVar');
           result0.should.equal('map-female-id-1'); 

           var result1 = factory.updater.call(node.vni(''), 'id-1', 'mapFileEnvVar');
           result1.should.equal('map-male-id-2');

           // try another value - just a simple number 
           var result2 = factory.updater.call(node.vni(''), '2', 'mapFileEnvVar');
           result2.should.equal('map-female-id-2'); 

           // try another value - just a simple number 
           var result3 = factory.updater.call(node.vni(''), 'Patient-1', 'mapFileEnvVar');
           result3.should.equal('map-female-id-5'); 
        });

        it("should map id from the hashmap using json data, & json pointer", function() {
            // Get some dummy cmumps json data
            var testfile = __dirname + '/data/testFhirPatient.json';
            var data = fs.readFileSync(testfile);
            var json_input = JSON.parse(data);

            // Set an env var with a file containing our hash map for mapping ids
            var testfile = __dirname+"/data/hash-map-ids.txt";
            process.env.mapFileEnvVar = testfile;

            var node = test.createComponent(factory);
            var result = factory.updater.call(node.vni(''),  
                                              'PatientId-100', 
                                              'mapFileEnvVar', 
                                              json_input,
                                              '/gender' );
            result.should.equal('map-male-id-1');
        });

        it("should map id from hash map if json pointer value is not in hash map", function() {
            // Get some dummy cmumps json data
            var testfile = __dirname + '/data/testFhirPatient.json';
            var data = fs.readFileSync(testfile);
            var json_input = JSON.parse(data);

            // Set an env var with a file containing our hash map for mapping ids
            var testfile = __dirname+"/data/hash-map-ids.txt";
            process.env.mapFileEnvVar = testfile;

            var node = test.createComponent(factory);
            var result = factory.updater.call(node.vni(''),  
                                              'PatientId-101', 
                                              'mapFileEnvVar', 
                                              json_input,
                                              '/birthDate' );
            result.should.equal('map-female-id-1');
        });

        it("should map id from hash map if json pointer value is undefined", function() {
            // Get some dummy cmumps json data
            var testfile = __dirname + '/data/testFhirPatient.json';
            var data = fs.readFileSync(testfile);
            var json_input = JSON.parse(data);

            // Set an env var with a file containing our hash map for mapping ids
            var testfile = __dirname+"/data/hash-map-ids.txt";
            process.env.mapFileEnvVar = testfile;

            var node = test.createComponent(factory);
            var result = factory.updater.call(node.vni(''),  
                                              'PatientId-110', 
                                              'mapFileEnvVar', 
                                              json_input,
                                              '/yoyo' );
            result.should.equal('map-male-id-1');
        });
    });

    describe('functional behavior', function() {

        it('should run in  a noflo network', function() {
            this.timeout(3000);

            return test.createNetwork(
                 { fileReader: 'filesystem/ReadFileSync',
                   parseJson: 'strings/ParseJson',
                   idHashMapper: 'rdf-components/id-hash-mapper' }

           ).then(function(network) {

                var fileReader = network.processes.fileReader.component;
                var parseJson = network.processes.parseJson.component;
                var idHashMapper = network.processes.idHashMapper.component;

                return new Promise(function(done, fail) {

                    test.onOutPortData(idHashMapper, 'output', done);

                    network.graph.addEdge('fileReader', 'out', 'parseJson', 'in');
                    network.graph.addEdge('parseJson', 'out', 'idHashMapper', 'json_input');

                    // Set up the inputs
                    network.graph.addInitial('PatientId-2000', 'idHashMapper', 'id');

                    var jsonfile = __dirname + '/data/testFhirPatient.json';
                    network.graph.addInitial(jsonfile, 'fileReader', 'in');

                    var hashfile = __dirname+"/data/hash-map-ids.txt";
                    process.env.mapFileEnvVar = hashfile;
                    network.graph.addInitial('mapFileEnvVar', 'idHashMapper', 'mapfile_envvar');
                    network.graph.addInitial('/gender', 'idHashMapper', 'json_pointer');

                }).then(function(done) {

                    test.verifyState( done, '', 'map-male-id-2');
                });
            }); 
        });

    });
});
