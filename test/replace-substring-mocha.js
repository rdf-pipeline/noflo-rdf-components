// replace-string-mocha.js

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var logger = require('../src/logger');

var test = require('./common-test');
var factory = require('../components/replace-substring');

describe('replace-string', function() {

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

        it('should throw an error if no string was specified', function() {
            expect(factory.updater.bind(this, undefined)).to.throw(Error,
                /Replace-substring component expects a target string, a substring to replace, and a replacement value!/);
        });

        it('should throw an error if no string to replace was specified', function() {
            expect(factory.updater.bind(this, "A string", undefined)).to.throw(Error,
                /Replace-substring component expects a target string, a substring to replace, and a replacement value!/);
        });

        it('should throw an error if no replacement value was specified', function() {
            expect(factory.updater.bind(this, "A string", "A", undefined)).to.throw(Error,
                /Replace-substring component expects a target string, a substring to replace, and a replacement value!/);
        });

        it('should replace a substring at the beginning of the string  with the specified value', function() {
           var node = test.createComponent(factory);
           var vni = node.vni('');
           var result = factory.updater.call(vni, "A string", "A", "One");
           result.should.equal("One string");
        });

        it('should replace a substring at the end of the string  with the specified value', function() {
           var node = test.createComponent(factory);
           var vni = node.vni('');
           var result = factory.updater.call(vni, "A string test", "test", "example");
           result.should.equal("A string example");
	});

        it('should replace a substring in the middle of the string  with the specified value', function() {
           var node = test.createComponent(factory);
           var vni = node.vni('');
           var result = factory.updater.call(vni, "A little string test", "little string", "small sample");
           result.should.equal("A small sample test");
	});

        it('should replace a substring an empty value', function() {
           var node = test.createComponent(factory);
           var vni = node.vni('');
           var result = factory.updater.call(vni, "A little string test", " little", "");
           result.should.equal("A string test");
	});
    });

    describe('functional behavior', function() {

        it('should replace a substring in a noflo network', function() {

            return test.createNetwork(
                 {replacer: 'rdf-components/replace-substring'}

           ).then(function(network) {
                var replacer = network.processes.replacer.component;

                return new Promise(function(done, fail) {

                    test.onOutPortData(replacer, 'output', done);
                    network.graph.addInitial("A wee test string", 'replacer', 'string');
                    network.graph.addInitial("wee", 'replacer', 'old_substring');
                    network.graph.addInitial("petit", 'replacer', 'new_substring');

                }).then(function(done) {
                    done.should.be.an('object');
                    test.verifyState(done, '', 'A petit test string');
                }, function(fail) {
                    console.error(fail);
                    throw Error(fail);
                }); 
            }); 
        });

        it('should replace substring on multiple inputs in a noflo network', function() {
            return test.createNetwork(
                 {input: 'core/Repeat',
                  replacer: 'rdf-components/replace-substring'}

           ).then(function(network) {
                var replacer = network.processes.replacer.component;

                network.graph.addEdge('input', 'out', 'replacer', 'string');

                return new Promise(function(done, fail) {

                    test.onOutPortData(replacer, 'output', done);

                    network.graph.addInitial("Jazz Band", 'input', 'in');
                    network.graph.addInitial("Band", 'replacer', 'old_substring');
                    network.graph.addInitial("Song", 'replacer', 'new_substring');

                }).then(function(done) {
                    test.verifyState(done, '', 'Jazz Song');

                    return new Promise(function(done2) {
                        test.onOutPortData(replacer, 'output', done2);
                        network.graph.addInitial("Pop Band", 'input', 'in');
                    }).then(function(done2) {
                        test.verifyState(done, '', 'Pop Song');
                    });

                }, function(fail) {
                    console.error(fail);
                    throw Error(fail);
                }); 

           });
        });
    });
});
