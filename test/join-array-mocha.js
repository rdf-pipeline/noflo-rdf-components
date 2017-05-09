/**
 * File: join-array-mocha.js
 * Unit tests for the lm APIs defined in components/join-array.js
 */

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var _ = require('underscore');

var factory = require('../components/join-array');
var logger = require('../src/logger');
var test = require('./common-test');

describe('join-array', function() {

    it("should exist as an object", function() {
        factory.should.exist;
        factory.should.be.an('function');
    });

    it("should instantiate a noflo component", function() {
        var node = test.createComponent(factory);
        node.should.be.an('object');
        node.should.include.keys('nodeName', 'componentName', 'outPorts', 'inPorts', 'vni', 'vnis');
    });

    describe("#updater", function() {

        it("should gracefully handle undefined input", function() {
            logger.silence('warn');
            expect(factory.updater()).to.be.undefined;
            logger.verbose('warn');
        });

        it("should gracefully handle empty input", function() {
            logger.silence('');
            expect(factory.updater()).to.be.empty;
            logger.verbose('warn');
        });

        it("should throw an error if given an non-array input", function() {
            expect(factory.updater.bind(this, {"foo": "bar"})).to.throw(Error,
                /Cannot join non-array input/);
        });

        it("should join an array of strings using default comma delimiter", function() { 
            var input = ["Where bamboos spire the shafted grove",
                         "And wide-mouthed orchids smile"];
            expect(factory.updater(input)).to.equal(input.join(","));
        });

        it("should join an array of strings using a specified delimiter", function() { 
            var input = ["Where bamboos spire the shafted grove",
                         "And wide-mouthed orchids smile"];
            expect(factory.updater(input, "+")).to.equal(input.join("+"));
        });

        it("should join an array of strings using an empty delimiter", function() { 
            var input = ["Where bamboos spire the shafted grove",
                         "And wide-mouthed orchids smile"];
            expect(factory.updater(input, "")).to.equal(input.join(""));
        });

        it("should join an array of strings using a multi-character delimiter", function() { 
            var input = ["Where bamboos spire the shafted grove",
                         "And wide-mouthed orchids smile"];
            expect(factory.updater(input, " -- ")).to.equal(input.join(" -- "));
        });

    });

    describe('functional behavior', function() {

        it("should join an array of strings in a noflo network", function() { 
            var delimiter = ', ';
            var input = ["And we will seek the quiet hill",
                         "Where towers the cotton tree",
                         "And leaps the laughing crystal rill",
                         "And works the droning bee."];

            return test.createNetwork(
                { repeater: 'core/Repeat',
                  joiner: 'rdf-components/join-array' 
            }).then(function(network) { 

                var joiner = network.processes.joiner.component;

                return new Promise(function(done, fail) {
                    test.onOutPortData(joiner, 'output', done);
                    test.onOutPortData(joiner, 'error', fail);

                    network.graph.addEdge('repeater', 'out', 'joiner', 'input');

                    network.graph.addInitial(delimiter, 'joiner', 'delimiter');
                    network.graph.addInitial(input, 'repeater', 'in');

                }).then(function(result) { 
                    test.verifyState(result, 
                                     '',
                                     input.join(delimiter));
                });
            });
        }); 

    });

});
