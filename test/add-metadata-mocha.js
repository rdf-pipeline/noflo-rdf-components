// add-metadata-mocha.js

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var test = require('./common-test');
var factory = require('../components/add-metadata');

describe('add-metadata', function() {

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

        it('should throw an error if no metadata name was specified', function() {
            expect(factory.updater.bind(this, undefined)).to.throw(Error,
                /Cannot add metadata with no name!/);
        });

        it('should return whatever the current VNI data is', function() {
           // Instantiate a component and set the VNI data 
           var node = test.createComponent(factory);
           var vni = node.vni('');
           var testdata = 'John Lally of Boston at art took a swipe - knocked her out cold with a concrete filled pipe...';
           vni.data = testdata;

           var attributeName = 'lallyColumn';
           var attributeValue = 'concrete';

           var result = factory.updater.call(vni, attributeName, attributeValue);
           result.should.equal(testdata);

           vni.should.include.keys('data', 'delete', 'vnid', 'inputStates', 'outputState', 
                                   'errorState', 'nodeInstance');
           vni.data.should.equal(testdata);

           var outputState = vni.outputState();
           test.verifyState(outputState , '');
           outputState[attributeName].should.equal(attributeValue);
        });
    });

    describe('functional behavior', function() {

        it('should send data in a noflo network', function() {
            var attributeName = 'Cows';
            var attributeValue = 'Brindle and Bessie, Jenny and Boss';

            return test.createNetwork(
                 { nameRepeater: 'core/Repeat',
                   valueRepeater: 'core/Repeat',
                   addMetadata: 'rdf-components/add-metadata'}
           ).then(function(network) {

                var nameRepeater = network.processes.nameRepeater.component;
                var valueRepeater = network.processes.valueRepeater.component;
                var addMetadata = network.processes.addMetadata.component;

                return new Promise(function(done) {

                    test.onOutPortData(addMetadata, 'output', done);
        
                    network.graph.addEdge('nameRepeater', 'out', 'addMetadata', 'name');
                    network.graph.addEdge('valueRepeater', 'out', 'addMetadata', 'value');

                    network.graph.addInitial(attributeName, 'nameRepeater', 'in');
                    network.graph.addInitial(attributeValue, 'valueRepeater', 'in');

                }).then(function(done) {
                    done.should.be.an('object');
                    test.verifyState(done, '');
                    done[attributeName].should.equal(attributeValue);
                });
            }); 
        });
    });
});
