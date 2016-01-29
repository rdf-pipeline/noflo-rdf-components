/**
 * File: Lm-mocha.js
 * Unit tests for the lm APIs defined in components/rdf-pipeline/Lm-mocha.js
 */

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');
var _ = require('underscore');

var Lm = require('../components/Lm');

describe('Lm', function() {

    it('should exist as a function', function() {
        Lm.should.exist;
        Lm.should.be.a('function');
    });

    it('should create a new lm object"', function() {

        var currentDate = Date.now();
        var myLm = Lm();

        // Does it have the right properties?
        myLm.should.not.be.null;
        myLm.should.be.an('object');
        myLm.constructor.name.should.equal('Lm');
        myLm.should.have.all.keys( 'timestamp', 'counter' );
        myLm.counter.should.equal(0); 
        myLm.timestamp.should.be.at.least( currentDate );
    });

    it('should increment the counter when Lms have the same timestamp', function() {
        var startingDate = Date.now();
        sinon.stub(Date, 'now', function() {
            return startingDate;
        });

        var myLm1 = Lm();
        var myLm2 = Lm();
        var myLm3 = Lm();

        myLm1.timestamp.should.equal( myLm2.timestamp );
        myLm2.timestamp.should.equal( myLm3.timestamp );

        myLm1.counter.should.equal(0);
        myLm2.counter.should.equal(1);
        myLm3.counter.should.equal(2);

        Date.now.restore();
    });

    it('should serialize with toString()', function() {

        // LMs are composed of a timestamp and a counter in their native 
        // Javascript object format.  However, they need to serialize to this 
        // format: LM<timestamp>.<counter>  - this test verifies that we get
        // this format on a toString() call with no value corruption

        var myLm1 = Lm();
        var myLm1String = myLm1.toString();

        myLm1String.should.be.a('string');
        myLm1String.startsWith('LM').should.be.true;
        myLm1String.should.contain('.');

        // Verify that the values we got in the string match the lm timestamp and counter
        // First, extract timestamp and counter numbers from our string which will have
        // look like  LM1454027961694.0000000000000000
        var components = myLm1String.match(/LM(\d+)\.(\d+)/);
        Number(components[1]).should.equal(myLm1.timestamp);
        Number(components[2]).should.equal(myLm1.counter);
    });

    it('should deserialize with LM(<lm string>)', function() {

        // Get a current LM and serialize it
        var myLm1 = Lm();
        var myLm1String = myLm1.toString();

        // Deserialize the serialized LM and compare it with the original
        var myLm2 = Lm( myLm1String );
        myLm2.should.be.an('object');
        myLm2.constructor.name.should.equal('Lm');
        myLm2.timestamp.should.equal( myLm1.timestamp );
        myLm2.counter.should.equal( myLm1.counter );

        myLm2.should.not.equal(myLm1);  // should be different objects (so not equal)
        myLm2.should.deep.equal(myLm1); // but with the same deep attribute values
    });

    it('should perform equality checks on same reference correctly', function() {

        var myLm1 = Lm();
        var myLm2 = myLm1;

        ( myLm2 != myLm1 ).should.be.false;
        ( myLm2 == myLm1 ).should.be.true;

        ( myLm2.valueOf() != myLm1.valueOf() ).should.be.false;
        ( myLm2.valueOf() == myLm1.valueOf() ).should.be.true;

        ( myLm2 !== myLm1 ).should.be.false;
        ( myLm2 === myLm1 ).should.be.true;

        _.isEqual( myLm2, myLm1 ).should.be.true;
    });

    it('should handle objects with same property value equality checks consistently with other Javascript objects', function() {
        
        var myLm1 = Lm();
        var myLm1String = myLm1.toString();
        var myLm2 = Lm( myLm1String ); 

        ( myLm2.valueOf() !== myLm1.valueOf() ).should.be.false;
        ( myLm2.valueOf() === myLm1.valueOf() ).should.be.true;
        
         _.isEqual( myLm2, myLm1 ).should.be.true;
    });

    it('should handle Lm inequality consistently with other Javascript objects', function() {
        
        // Generate two LMs that should be different from one another
        var myLm1 = Lm();
        var myLm2 = Lm();

        ( myLm2 != myLm1 ).should.be.true;
        ( myLm2 == myLm1 ).should.be.false;

        ( myLm2.valueOf() !== myLm1.valueOf() ).should.be.true;
        ( myLm2.valueOf() === myLm1.valueOf() ).should.be.false;

        ( myLm2 !== myLm1 ).should.be.true;
        ( myLm2 === myLm1 ).should.be.false;

        _.isEqual( myLm2, myLm1 ).should.be.false;
   });
});
