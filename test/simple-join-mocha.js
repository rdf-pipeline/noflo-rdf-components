// simple-join-mocha.js

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var test = require('./common-test');
var compFactory = require('../components/simple-join');

describe('simple-join', function() {

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
                /Simple join component requires a vnid hash parameter!/);
        });

        it('should throw an error if vnid_hash is empty', function() {
            expect(compFactory.updater.bind(this, {})).to.throw(Error,
                /Simple join component requires a vnid hash parameter!/);
        });

        it('should throw an error if vnid_hash is not an object', function() {
            expect(compFactory.updater.bind(this, 'a string')).to.throw(Error,
                /Simple join component requires a vnid hash parameter!/);
        });

        it('should return the vnid hash when given a hash but no input', function() {
           var result = compFactory.updater({"1": "one", "2": "two", "3": "three"});
           result.should.deep.equal({ vnid_hash: { '1': 'one', '2': 'two', '3': 'three' }, input: undefined});
        });

        it('should return the vnid hash and input when given both', function() {
           var result = compFactory.updater({"1": "one", "2": "two", "3": "three"},'one');
           result.should.deep.equal({ vnid_hash: { '1': 'one', '2': 'two', '3': 'three' }, input: 'one'});
        });
    });

    describe('functional behavior', function() {

        it('should send updated 1 element hash when resolved in a noflo network', function() {
            // Create a test network with the object and vni-data-output components
            return test.createNetwork(
                { nodeA: 'rdf-components/parse-json',
                  nodeS: 'rdf-components/simple-splitter',
                  nodeB: 'rdf-components/to-upper-case',
                  nodeJ: 'rdf-components/simple-join'}

            ).then(function(network) {

                return new Promise(function(done) {

                    var nodeA = network.processes.nodeA.component;
                    var nodeS = network.processes.nodeS.component;
                    var nodeB = network.processes.nodeB.component;
                    var nodeJ = network.processes.nodeJ.component;

                    test.onOutPortData(nodeJ, 'output', done);

                    network.graph.addEdge('nodeA', 'output', 'nodeS', 'vnid_hash');
                    network.graph.addEdge('nodeA', 'output', 'nodeJ', 'vnid_hash');
                    network.graph.addEdge('nodeS', 'output', 'nodeB', 'string');
                    network.graph.addEdge('nodeB', 'output', 'nodeJ', 'input');

                    var testHash = '{ "1" : "one" }';
                    network.graph.addInitial(testHash, 'nodeA', 'input');

                }).then(function(done) {
                    done.should.be.an('object');
                    done.vnid.should.equal('');
                    done.data.should.deep.equal({ '1': 'ONE' });
                    expect(done.error).to.be.undefined;
                    expect(done.stale).to.be.undefined;
                    expect(done.groupLm).to.be.undefined;
                    done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                });
            });
        });

        it('should send updated 3 element hash when resolved in a noflo network', function() {
            // Create a test network with the object and vni-data-output components
            return test.createNetwork(
                { nodeA: 'rdf-components/parse-json',
                  nodeS: 'rdf-components/simple-splitter',
                  nodeB: 'rdf-components/to-upper-case',
                  nodeJ: 'rdf-components/simple-join'}

            ).then(function(network) {

                return new Promise(function(done) {

                    var nodeA = network.processes.nodeA.component;
                    var nodeS = network.processes.nodeS.component;
                    var nodeB = network.processes.nodeB.component;
                    var nodeJ = network.processes.nodeJ.component;

                    test.onOutPortData(nodeJ, 'output', done);

                    network.graph.addEdge('nodeA', 'output', 'nodeS', 'vnid_hash');
                    network.graph.addEdge('nodeA', 'output', 'nodeJ', 'vnid_hash');
                    network.graph.addEdge('nodeS', 'output', 'nodeB', 'string');
                    network.graph.addEdge('nodeB', 'output', 'nodeJ', 'input');

                    var testHash = '{ "1" : "one", "2" : "two", "3" : "three" }';
                    network.graph.addInitial(testHash, 'nodeA', 'input');

                }).then(function(done) {
                    done.should.be.an('object');
                    done.vnid.should.equal('');
                    done.data.should.deep.equal({ '1': 'ONE', '2': 'TWO', '3': 'THREE' });
                    expect(done.error).to.be.undefined;
                    expect(done.stale).to.be.undefined;
                    expect(done.groupLm).to.be.undefined;
                    done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                });
            });
        });
    });
});
