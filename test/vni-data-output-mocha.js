// vni-data-output-mocha.js

var chai = require('chai');

var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var _ = require('underscore');

var test = require('./common-test');

describe('vni-data-output graph', function() {

    it('should print the data from a vni to the console', function() {
        this.timeout(3250);

        // Hide the log output to avoid test clutter
        sinon.stub(console,'log');

        // Create a test network with the object and vni-data-output components
        return test.createNetwork(
             { node1: 'rdf-components/object',
               node2: 'rdf-components/vni-data-output'}
        ).then(function(network) {

                return new Promise(function(done) {

                    // Get the true noflo component - not facade
                    var node1 = network.processes.node1.component;
                    var node2 = network.processes.node2.component;

                    test.onOutPortData(node2, 'out', done);

                    network.graph.addEdge('node1', 'output', 'node2', 'in');

                    network.graph.addInitial("knock knock", 'node1', 'key');
                    network.graph.addInitial("who is there?", 'node1', 'value');

                }).then(function(done) {
                    console.log.restore();
                    done.should.deep.equal({"knock knock": "who is there?"});
                });
            });
       });
});


