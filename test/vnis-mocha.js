/**
 * File: vnis-mocha.js
 * Unit tests for the vni APIs defined in src/vnis.js
 */

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var vnis = require('../src/vnis');

describe('vnis', function() {

    it('should exist as an object', function() {
      vnis.should.exist;
      vnis.should.be.a('object');
    });

    describe('#get', function() {

        beforeEach(function() {
            testNodeContext = { 
                rpf: {  
                    vnis: vnis 
                } 
            };
        });

        afterEach(function() {
            // clean up
            vnis.deleteAll.call( testNodeContext );
        });

        it('should create and return a new IIP vni if no vnid is specified and no vni exists', function() {

            var testVni = vnis.get.call( testNodeContext );

            testVni.should.be.an('object');
            testVni.vnid.should.equal('');
            testVni.inputStates.should.exist;
            testVni.node.should.exist;

            expect( testVni.error).to.be.undefined;
            expect( testVni.output ).to.be.undefined;
            expect( testVni.parentVni ).to.be.undefined;
            expect( testVni.previousLms ).to.be.undefined;
        });

        it('should create and return a new IIP vni if an empty vnid is specified and no vni exists', function() {
  
            var testVnid = '';
            var testVni = vnis.get.call( testNodeContext, testVnid );

            testVni.should.be.an('object');
            testVni.vnid.should.equal( testVnid );
            testVni.inputStates.should.exist;
            testVni.node.should.exist;

            expect( testVni.error).to.be.undefined;
            expect( testVni.output ).to.be.undefined;
            expect( testVni.parentVni ).to.be.undefined;
            expect( testVni.previousLms ).to.be.undefined;
        });
    });

    describe('#delete', function() {

        it('should delete the specified vni', function() {

            testNodeContext = { 
                rpf: {  
                    vnis: vnis 
                } 
            };
            var testVnid = '';
            var testVni = vnis.get.call( testNodeContext, testVnid );
            testVni.should.be.an('object');
            
            vnis.delete.call( testNodeContext, testVnid );
            var testVni2 = vnis.get.call( testNodeContext, testVnid );

            testVni2.should.be.an('object');
            testVni2.should.not.equal( testVni ); 
        });

    });
});
