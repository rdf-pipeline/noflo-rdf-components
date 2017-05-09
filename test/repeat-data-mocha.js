// repeat-data-mocha.js

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var test = require('./common-test');
var factory = require('../components/repeat-data');

describe('repeat-data', function() {

    it('should exist as a function', function() {
        factory.should.exist;
        factory.should.be.a('function');
    });

    it('should instantiate a noflo component', function() {
	this.timeout(4000);
        var node = test.createComponent(factory);
        node.should.be.an('object');
        node.should.include.keys('nodeName', 'componentName', 'outPorts', 'inPorts', 'vni', 'vnis');
    });

    describe('#updater', function() {

        it('should return the new data', function() {
           // Instantiate a component and set the VNI data 
           var node = test.createComponent(factory);
           var vni = node.vni('');

           var oldData = "If you want anything done well, do it yourself." +
                         "  This is why most people laugh at their own jokes.";

           var newData = "He who laughs last didn’t get it.";

           var result = factory.updater.call(vni, newData, oldData);
           result.should.equal(newData);
        });
    });

    describe('functional behavior', function() {

        it('should forwarding new data and any metadata in a noflo network', function() {
            var attributeName = 'Speaker';
            var attributeValue = 'Helen Giangregorio';
            var oldData = "If you want anything done well, do it yourself." +
                          "  This is why most people laugh at their own jokes.";
            var newData = "He who laughs last didn’t get it.";

            return test.createNetwork(
                 { alpha: 'rdf-components/object',
                   addMetadatum: 'rdf-components/add-metadatum',
                   repeatData: 'rdf-components/repeat-data'}

           ).then(function(network) {
                var alpha = network.processes.alpha.component;
                var addMetadatum = network.processes.addMetadatum.component;
                var repeatData = network.processes.repeatData.component;

                return new Promise(function(done, fail) {

                    test.onOutPortData(repeatData, 'output', done);
        
                    network.graph.addEdge('alpha', 'output', 'addMetadatum', 'data');
                    network.graph.addEdge('addMetadatum', 'output', 'repeatData', 'old_data');

                    // Create an object
                    network.graph.addInitial('Quote', 'alpha', 'key');
                    network.graph.addInitial(oldData, 'alpha', 'value');

                    // Set some metadata on the object VNI
                    network.graph.addInitial(attributeName, 'addMetadatum', 'name');
                    network.graph.addInitial(attributeValue, 'addMetadatum', 'value');

                    // Set some new data on repeatData 
                    network.graph.addInitial(newData, 'repeatData', 'new_data');

                }).then(function(done) {
                    done.should.be.an('object');
                    done.should.have.all.keys('vnid', 'data', 'error', 'stale',
                                              'groupLm', 'lm', 'componentName', 'Speaker');
                    test.verifyState(done, '', newData);
                    done[attributeName].should.equal(attributeValue);
                }, function(fail) {
                    console.error(fail);
                    throw Error(fail);
                }); 
            }); 
        });

    });
});
