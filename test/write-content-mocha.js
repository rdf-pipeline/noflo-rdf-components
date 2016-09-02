// write-content-mocha.js

var _ = require('underscore');
var fs = require('fs');

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var test = require('./common-test');
var factory = require('../components/write-content');

describe('write-content', function() {

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

        it('should throw an error if filename is not specified', function() {
            expect(factory.updater.bind(this, undefined)).to.throw(Error,
                /Write content component requires a file name!/);
        });

        it('should throw an error if file cannot be written', function(done) {

            // Create a file path with a directory that does not exist.  This should
            // cause an error when we try to write to it.
            var randomInt = String(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
            var filepath = '/tmp/'+ 'foo' + randomInt + '/bar'+ randomInt + '.out';

            var node = test.createComponent(factory);
            var vni = node.vni('');

            return new Promise(function(resolve, fail) {

                var result = factory.updater.call(vni, filepath);
                resolve(result);

            }).then(function(result) {
                assert.fail("Writing to a non-existent directory should throw an Error!");
            }, function(fail) { 
                fail.code.should.equal('ENOENT');
                done();
            });
 
        });

        it('should write an empty file if data is undefined', function() {
            var filepath = '/tmp/emptyFile.out';

            var node = test.createComponent(factory);
            var vni = node.vni('');

            return new Promise(function(resolve, fail) {

                var result = factory.updater.call(vni, filepath);
                resolve(result);

            }).then(function(result) {

                result.should.equal(filepath);

                // Verify the file was created and is empty
                var stats = fs.statSync(filepath);
                stats.should.not.be.undefined;
                stats.should.be.an('object');
                stats.size.should.equal(0);

                // Clean it up since it all looks OK
                fs.unlinkSync(filepath);

            }, function(fail) { 
                assert.fail("Unable to write file:", fail);
            });
 
        });

        it('should write a primitive string to the file', function() {

            var filepath = '/tmp/stringFile.out';
            var string = "With great power comes an even greater electricity bill.";

            var node = test.createComponent(factory);
            var vni = node.vni('');

            return new Promise(function(resolve, fail) {

                var result = factory.updater.call(vni, filepath, string, 'utf8');
                resolve(result);

            }).then(function(result) {

                result.should.equal(filepath);

                // Verify the file was created and has content
                var stats = fs.statSync(filepath);
                stats.should.not.be.undefined;
                stats.should.be.an('object');
                stats.size.should.be.greaterThan(0);

                // verify that the correct content is there
                var content = fs.readFileSync(filepath, 'utf8');
                content.should.equal(string);

                // Clean it up since it all looks OK
                fs.unlinkSync(filepath);

            }, function(fail) {
                assert.fail("Unable to write string to file:", fail);
            });
	});

        it('should write an object to the file', function() {

            var filepath = '/tmp/objectFile.out';
            var napoleon = {
                quote: "What is history but a fable agreed upon?",
                count: [ "un", "deux", "trois" ],
                moreQuotes: {
                    leadership: "A leader is a dealer in hope.", 
                    politics: "In politics, stupidity is not a handicap"
                }
            };

            var node = test.createComponent(factory);
            var vni = node.vni('');

            return new Promise(function(resolve, fail) {

                var result = factory.updater.call(vni, filepath, napoleon, 'utf8');
                resolve(result);

            }).then(function(result) {

                result.should.equal(filepath);

                // Verify the file was created and has content
                var stats = fs.statSync(filepath);
                stats.should.not.be.undefined;
                stats.should.be.an('object');
                stats.size.should.be.greaterThan(0);

                // verify that the correct content is there
                var content = fs.readFileSync(filepath, 'utf8');
                var parsed = JSON.parse(content);
 
                parsed.should.have.all.keys(_.keys(napoleon));
                parsed.should.deep.equal(napoleon);

                // Clean it up since it all looks OK
                fs.unlinkSync(filepath);

            }, function(fail) {
                assert.fail("Unable to write string to file:", fail);
            });
	});

    });

    describe('functional behavior', function() {

        it('should write content in a noflo network', function() {

            var filepath = '/tmp/elizabeth_1.out';
            var string = "Much suspected by me, nothing proved can be.";

            return test.createNetwork(
                 {writer: 'rdf-components/write-content'}

           ).then(function(network) {
                var writer = network.processes.writer.component;

                return new Promise(function(done, fail) {

                    test.onOutPortData(writer, 'output', done);
                    test.onOutPortData(writer, 'error', fail);
        
                    network.graph.addInitial(filepath, 'writer', 'filename');
                    network.graph.addInitial(string, 'writer', 'data');

                }).then(function(done) {

                    test.verifyState(done, '', filepath);

                    // Verify the file was created and has content
                    var stats = fs.statSync(filepath);
                    stats.should.not.be.undefined;
                    stats.should.be.an('object');
                    stats.size.should.be.greaterThan(0);

                    // verify that the correct content is there
                    var content = fs.readFileSync(filepath, 'utf8');
                    content.should.equal(string);

                    // Clean it up since it all looks OK
                    fs.unlinkSync(filepath);

                }, function(fail) {
                    console.error(fail);
                    throw Error(fail);
                }); 
            }); 
        });

    });
});
