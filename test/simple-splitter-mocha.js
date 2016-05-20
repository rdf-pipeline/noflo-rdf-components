// simple-splitter-mocha.js

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var test = require('./common-test');
var compFactory = require('../components/simple-splitter');

describe('simple-splitter', function() {

    it('should exist as a function', function() {
        compFactory.should.exist;
        compFactory.should.be.a('function');
    });

    it('should instantiate a noflo component', function() {
        var node = test.createComponent(compFactory);
        node.should.be.an('object');
        node.should.include.keys('nodeName', 'componentName', 'outPorts', 'inPorts', 'vni', 'vnis');
    });

    describe('#updater', function() {

        it('should throw an error if vnid_hash is undefined', function() {
            expect(compFactory.updater.bind(this, undefined)).to.throw(Error,
                /Simple splitter component requires a vnid hash parameter!/);
        });

        it('should throw an error if vnid_hash is empty', function() {
            expect(compFactory.updater.bind(this, {})).to.throw(Error,
                /Simple splitter component requires a vnid hash parameter!/);
        });

        it('should throw an error if vnid_hash is not an object', function() {
            expect(compFactory.updater.bind(this, 'a string')).to.throw(Error,
                /Simple splitter component requires a vnid hash parameter!/);
        });

        it('should return the vnid hash', function() {
           var result = compFactory.updater({"1": "one", "2": "two", "3": "three"});
           result.should.deep.equal({ '1': 'one', '2': 'two', '3': 'three' });
        });
    });

    describe('functional behavior', function() {

        it('should send data in a noflo network', function() {

            return test.createNetwork(
                 { nodeA: 'rdf-components/parse-json',
                   nodeS: 'rdf-components/simple-splitter'}
            ).then(function(network) {

                return new Promise(function(done) {

                    var nodeA = network.processes.nodeA.component;
                    var nodeS = network.processes.nodeS.component;

                    test.onOutPortData(nodeS, 'output', done);
        
                    network.graph.addEdge('nodeA', 'output', 'nodeS', 'vnid_hash');

                    var testHash = '{ "1" : "one" }';
                    network.graph.addInitial(testHash, 'nodeA', 'input');

                }).then(function(done) {
                    done.should.be.an('object');
                    done.vnid.should.equal('1');
                    done.data.should.equal("one");
                    expect(done.error).to.be.undefined;
                    expect(done.stale).to.be.undefined;
                    done.groupLm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                    done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                });
            }); 
        });
    });
});
