/**
 * File: lm.js
 * Unit tests for the lm APIs defined in components/rdf-pipeline/lm.js
 */

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var lm = require('../components/lm');

describe('lm', function() {

  it('should exist as an object', function() {
    lm.should.exist;
    lm.should.be.an('object');
  });

  describe('#Lm', function () {

    it('should exist in module.exports', function() {
      lm.Lm.should.exist;
      lm.Lm.should.be.a('function');
    });

    it('should create a new lm object"', function() {

      var currentDate = Date.now();
      var myLm = lm.Lm();

      // Does it have the right properties?
      myLm.should.not.be.null;
      myLm.should.be.an('object');
      myLm.should.have.all.keys( 'timestamp', 'counter' );
      myLm.counter.should.equal(0); 
      myLm.timestamp.should.be.at.least( currentDate );
    });

    it('should increment the counter when Lms have the same timestamp', function() {
      var startingDate = Date.now();
      sinon.stub(Date, 'now', function() {
        return startingDate;
      });

      var myLm1 = lm.Lm();
      var myLm2 = lm.Lm();
      var myLm3 = lm.Lm();

      myLm1.timestamp.should.equal( myLm2.timestamp );
      myLm2.timestamp.should.equal( myLm3.timestamp );

      myLm1.counter.should.equal(0);
      myLm2.counter.should.equal(1);
      myLm3.counter.should.equal(2);

      Date.now.restore();
    });
  });
});
