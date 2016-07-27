// confluence-mocha.js

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var test = require('./common-test');
var factory = require('../components/confluence');

describe('confluence', function() {

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

        it('given a single element, should return an array with that element', function() {
           var string = 'Aloha!';
           var result = factory.updater(string);
           result.should.deep.equal([string]);
        });

    });

    describe('functional behavior', function() {

        it('given one input edge with an object, it should return an array with the data from both inputs in a noflo network', function() {

            var data = { greetings: 'Aloha', morning: 'kakahiaka' }

            // Create a test network with the object and vni-data-output components
            return test.createNetwork(
                { inputNode: 'core/Repeat',
                  confluenceNode: 'rdf-components/confluence'}

            ).then(function(network) {

                var inputNode = network.processes.inputNode.component;
                var confluenceNode = network.processes.confluenceNode.component;

                return new Promise(function(done, fail) {

                    test.onOutPortData(confluenceNode, 'output', done);
                    test.onOutPortData(confluenceNode, 'error', fail);

                    network.graph.addEdge('inputNode', 'out', 'confluenceNode', 'input');

                    // Feed in a single object as input to the network 
                    network.graph.addInitial(data, 'inputNode', 'in');

                }).then(function(done) {
                    test.verifyState(done, '', [data]);
                });
           });
        });

        it('given two input edges, should return an array with the data from both inputs in a noflo network', function() {
           var data1 = 'Aloha';
           var data2 = 'Mahalo';

            // Create a test network with the object and vni-data-output components
            return test.createNetwork(
                { input1: 'core/Repeat',
                  input2: 'core/Repeat',
                  confluence: 'rdf-components/confluence'}

            ).then(function(network) {

                var input1 = network.processes.input1.component;
                var input2 = network.processes.input2.component;
                var confluence = network.processes.confluence.component;

                return new Promise(function(done, fail) {

                    test.onOutPortData(confluence, 'output', done);
                    test.onOutPortData(confluence, 'error', fail);

                    network.graph.addEdge('input1', 'out', 'confluence', 'input');
                    network.graph.addEdge('input2', 'out', 'confluence', 'input');

                    network.graph.addInitial(data1, 'input1', 'in');
                    network.graph.addInitial(data2, 'input2', 'in');

                }).then(function(done) {
                    test.verifyState(done, '', [data1, data2]);
                });
            });
        });

    });
});
