// and-gate-mocha.js

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var test = require('./common-test');
var factory = require('../components/and-gate');

describe('and-gate', function() {

    it('should exist as a function', function() {
        factory.should.exist;
        factory.should.be.a('function');
    });

    it('should instantiate a noflo component', function() {
        var node = test.createComponent(factory);
        node.should.be.an('object');
        node.should.include.keys('nodeName', 'componentName', 'outPorts', 'inPorts', 'vni', 'vnis');
    });

    describe('functional behavior', function() {

        it('should process one input in a noflo network', function() {
           var one = "One is the loneliest number";

            return test.createNetwork(
                {repeater1: 'core/Repeat',
                 gate: 'rdf-components/and-gate'}

           ).then(function(network) {
                var repeater1 = network.processes.repeater1.component;
                var gate = network.processes.gate.component;

                return new Promise(function(done, fail) {

                    test.onOutPortData(gate, 'output', done);
        
                    network.graph.addEdge('repeater1', 'out', 'gate', 'input');

                    network.graph.addInitial(one, 'repeater1', 'in');

                }).then(function(done) {
                    done.should.be.an('object');
                    test.verifyState(done, '', [one]);
                    done.componentName.should.equal('rdf-components/and-gate');
                }, function(fail) {
                    console.error(fail);
                    throw Error(fail);
                }); 
            }); 
        });

        it('should process two inputs in a noflo network', function() {
           var one = "One is the loneliest number";
           var two = "Two can be as bad as one";

            return test.createNetwork(
                {repeater1: 'core/Repeat',
                 repeater2: 'core/Repeat',
                 gate: 'rdf-components/and-gate'}

           ).then(function(network) {
                var repeater1 = network.processes.repeater1.component;
                var repeater2 = network.processes.repeater2.component;
                var gate = network.processes.gate.component;

                return new Promise(function(done, fail) {

                    test.onOutPortData(gate, 'output', done);
        
                    network.graph.addEdge('repeater1', 'out', 'gate', 'input');
                    network.graph.addEdge('repeater2', 'out', 'gate', 'input');

                    network.graph.addInitial(one, 'repeater1', 'in');
                    network.graph.addInitial(two, 'repeater2', 'in');

                }).then(function(done) {
                    done.should.be.an('object');
                    test.verifyState(done, '', [one, two]);
                    done.componentName.should.equal('rdf-components/and-gate');
                }, function(fail) {
                    console.error(fail);
                    throw Error(fail);
                }); 
            }); 
        });

    });
});
