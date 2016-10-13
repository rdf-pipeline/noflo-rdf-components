// add-metadatum-mocha.js

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var logger = require('../src/logger');

var test = require('./common-test');
var factory = require('../components/add-metadatum');

describe('add-metadatum', function() {

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

        it('should set metadata and return whatever the current VNI data is', function() {
           // Instantiate a component and set the VNI data 
           var node = test.createComponent(factory);
           var vni = node.vni('');
           var testdata = 'John Lally of Boston at art took a swipe - knocked her out cold with a concrete filled pipe...';

           var attributeName = 'lallyColumn';
           var attributeValue = 'concrete';

           var result = factory.updater.call(vni, attributeName, attributeValue, testdata);
           result.should.equal(testdata);

           var outputState = vni.outputState();
           test.verifyState(outputState , '');
           outputState[attributeName].should.equal(attributeValue);
        });
    });

    describe('functional behavior', function() {

        it('should add metadata in a noflo network', function() {
            this.timeout(3000);
            var attributeName = 'Cows';
            var attributeValue = 'Brindle and Bessie, Jenny and Boss';
            var testdata = '{"name": "Jenny", "address": "Meadow Farm"}';

            return test.createNetwork(
                 { alpha: 'rdf-components/parse-json',
                   valueRepeater: 'core/Repeat',
                   addMetadatum: 'rdf-components/add-metadatum'}

           ).then(function(network) {
                var alpha = network.processes.alpha.component;
                var valueRepeater = network.processes.valueRepeater.component;
                var addMetadatum = network.processes.addMetadatum.component;

                return new Promise(function(done, fail) {

                    test.onOutPortData(addMetadatum, 'output', done);
        
                    network.graph.addEdge('alpha', 'output', 'addMetadatum', 'data');
                    network.graph.addEdge('valueRepeater', 'out', 'addMetadatum', 'value');

                    logger.silence('warn');
                    network.graph.addInitial(testdata, 'alpha', 'input');
                    network.graph.addInitial(attributeName, 'addMetadatum', 'name');
                    network.graph.addInitial(attributeValue, 'valueRepeater', 'in');

                }).then(function(done) {
                    logger.verbose('warn');
                    done.should.be.an('object');
                    test.verifyState(done, '', JSON.parse(testdata));
                    done[attributeName].should.equal(attributeValue);
                }, function(fail) {
                    console.error(fail);
                    logger.verbose('warn');
                    throw Error(fail);
                }); 
            }); 
        });

    });
});
