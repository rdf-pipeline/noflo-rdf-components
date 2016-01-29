/**
 * File: Lm-mocha.js
 * Unit tests for the lm APIs defined in components/rdf-pipeline/Lm-mocha.js
 */

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');
var _ = require('underscore');

var LmFactory = require('../components/LmFactory');

describe('LmFactory', function() {

    it('should exist as a function', function() {
        LmFactory.should.exist;
        LmFactory.should.be.a('function');
    });

    it('should create a new Lm string with the correct components', function() {

        // Set up a stub on the date so we can be sure to get a unique LM 
        // with a counter value of 0
        var startingDate = Date.now()+1;
        sinon.stub(Date, 'now', function() {
            return startingDate;
        });

        var testLm = LmFactory();

        testLm.should.not.be.null;
        testLm.should.be.a('string');

        // Verify we got the expected LM prefix 
        testLm.startsWith('LM').should.be.true;

        // Examine the each of the numeric components in the string
        var components = testLm.match(/^LM(\d+)\.(\d+)$/);
        components.should.have.length(3);
        components[0].should.equal( testLm );
        Number( components[1] ).should.be.at.least( startingDate );
        Number( components[2] ).should.equal( 0 );

        // clean up the stub
        Date.now.restore();
    });

    it('should increment the counter when Lms have the same timestamp', function() {

        // Set up a stub on the date so we can be sure to get a unique LM 
        // with a counter value of 0
        var startingDate = Date.now()+1;
        sinon.stub(Date, 'now', function() {
            return startingDate;
        });

        var testLm1 = LmFactory();
        var components1 = testLm1.match(/^LM(\d+)\.(\d+)$/);
        components1.should.have.length(3);

        var testLm2 = LmFactory();
        var components2 = testLm2.match(/^LM(\d+)\.(\d+)$/);
        components2.should.have.length(3);

        var testLm3 = LmFactory();
        var components3 = testLm3.match(/^LM(\d+)\.(\d+)$/);
        components3.should.have.length(3);

        Number( components1[1] ).valueOf().should.equal( Number( components2[1] ).valueOf());
        Number( components2[1] ).valueOf().should.equal( Number( components3[1] ).valueOf());

        parseInt( components1[2]).valueOf().should.equal(0);
        parseInt( components2[2] ).valueOf().should.equal(1);
        parseInt( components3[2] ).valueOf().should.equal(2);

        // clean up the stub
        Date.now.restore();
    });

    it('should perform equality checks on same reference correctly', function() {

        var testLm1 = LmFactory();
        var testLm2 = testLm1;

        ( testLm2 != testLm1 ).should.be.false;
        ( testLm2 == testLm1 ).should.be.true;

        ( testLm2.valueOf() != testLm1.valueOf() ).should.be.false;
        ( testLm2.valueOf() == testLm1.valueOf() ).should.be.true;

        ( testLm2 !== testLm1 ).should.be.false;
        ( testLm2 === testLm1 ).should.be.true;

        _.isEqual( testLm2, testLm1 ).should.be.true;
    });

    it('should perform equality checks on the same Lm string value correctly', function() {
        
        var testLm1 = LmFactory();
        var testLm2 = '' + testLm1; 

        ( testLm2 != testLm1 ).should.be.false;
        ( testLm2 == testLm1 ).should.be.true;

        ( testLm2.valueOf() !== testLm1.valueOf() ).should.be.false;
        ( testLm2.valueOf() === testLm1.valueOf() ).should.be.true;
        
        ( testLm2 !== testLm1 ).should.be.false;
        ( testLm2 === testLm1 ).should.be.true;

         _.isEqual( testLm2, testLm1 ).should.be.true;
    });

    it('should handle Lm inequality between Lm string values correctly', function() {
        
        // Generate two LMs that should be different from one another
        var testLm1 = LmFactory();
        var testLm2 = LmFactory();

        ( testLm2 != testLm1 ).should.be.true;
        ( testLm2 == testLm1 ).should.be.false;

        ( testLm2.valueOf() !== testLm1.valueOf() ).should.be.true;
        ( testLm2.valueOf() === testLm1.valueOf() ).should.be.false;

        ( testLm2 !== testLm1 ).should.be.true;
        ( testLm2 === testLm1 ).should.be.false;

        _.isEqual( testLm2, testLm1 ).should.be.false;
   });
});
