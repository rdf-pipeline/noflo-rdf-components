// component-helper-mocha.js

var chai = require('chai');

var expect = chai.expect;
var should = chai.should();

var _ = require('underscore');

var factory = require('../src/pipeline-component-factory');
var vniManager = require('../src/vni-manager');

var test = require('./common-test');

var helper = require('../src/component-helper');

describe('component-helper', function() {

    it('should exist as an object', function() {
        helper.should.exist;
        helper.should.be.an('object');
    });

    describe('#refreshOutputLm', function() {
        it('should update the outputState LM', function() {

            var node = test.createComponent(factory(function() {return arguments;}), vniManager);
            node.should.be.an('object');
            node.should.include.keys('nodeName', 'componentName', 'inPorts', 'outPorts',
                                     'deleteAllVnis', 'deleteVni', 'vni', 'vnis');
            var vni = node.vni('');
            vni.should.be.an('object');

            // Get the output state and verify it is what we expect when first initilizing
            vni.outputState.should.exist;
            vni.outputState.should.be.a('function');
            var outputState = vni.outputState();
            outputState.should.be.an('object'); 
            expect(outputState.lm).to.be.undefined;

            // Call refreshOutputLm and verify it succeeds and sets the output LM
            expect(helper.refreshOutputLm(vni)).to.not.throw.error;
            var lm1 = vni.outputState().lm;
            lm1.should.not.be.undefined;
            lm1.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
 
            // Now that we have a value in the LM, call refreshOutputLm again
            // and verify that it is updated. 
            expect(helper.refreshOutputLm(vni)).to.not.throw.error;
            var lm2 = vni.outputState().lm;
            lm2.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
            lm2.should.not.equal(lm1);
        });
    });
});

