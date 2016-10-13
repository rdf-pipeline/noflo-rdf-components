// extract-metadatum-mocha.js

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var test = require('./common-test');
var stateFactory = require('../src/create-state');
var factory = require('../components/extract-metadatum');

describe('extract-metadatum', function() {

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
                /Cannot extract metadata attribute with no name!/);
        });

        it('should throw an error if metadata attribute name does not exist', function() {

            var node = test.createComponent(factory);
            var vni = node.vni('');

            var stateVal = 'one little state';
            vni.inputStates({'input': stateFactory('', stateVal)});
            
            expect(factory.updater.bind(vni, 'testId', stateVal)).to.throw(Error,
                /Metadata attribute testId does not exist!/);
        });

    });

    describe('functional behavior', function() {

        it('should add metadata in a noflo network', function() {
            var attributeName = 'Cows';
            var attributeValue = 'Brindle and Bessie, Jenny and Boss';
            var testdata = '{"name": "Jenny", "address": "Meadow Farm"}';

            return test.createNetwork(
                 { alpha: 'rdf-components/parse-json',
                   valueRepeater: 'core/Repeat',
                   addMetadatum: 'rdf-components/add-metadatum',
                   extractMetadatum: 'rdf-components/extract-metadatum'}

           ).then(function(network) {
                var alpha = network.processes.alpha.component;
                var valueRepeater = network.processes.valueRepeater.component;
                var addMetadatum = network.processes.addMetadatum.component;
                var extractMetadatum = network.processes.extractMetadatum.component;

                return new Promise(function(done, fail) {

                    test.onOutPortData(extractMetadatum, 'output', done);
        
                    network.graph.addEdge('alpha', 'output', 'addMetadatum', 'data');
                    network.graph.addEdge('valueRepeater', 'out', 'addMetadatum', 'value');
                    network.graph.addEdge('addMetadatum', 'output', 'extractMetadatum', 'input');

                    network.graph.addInitial(testdata, 'alpha', 'input');
                    network.graph.addInitial(attributeName, 'addMetadatum', 'name');
                    network.graph.addInitial(attributeValue, 'valueRepeater', 'in');
                    network.graph.addInitial(attributeName, 'extractMetadatum', 'name');
 

                }).then(function(done) {
                    done.should.be.an('object');

                    // verify we got the metadata attribute and metadata is also still on the VNI
                    test.verifyState(done, '', attributeValue);
                    done[attributeName].should.equal(attributeValue);

                }, function(fail) {
                    console.error(fail);
                    throw Error(fail);
                }); 
            }); 
        });

    });
});
