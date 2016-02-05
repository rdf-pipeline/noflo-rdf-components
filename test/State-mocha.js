/**
 * File: State-mocha.js
 * Unit tests for the state object
 */

var chai = require('chai');
var should = chai.should();
var expect = chai.expect;

var State = require('../components/State');

describe("State", function() {

    it("should exist as a function", function() {
        State.should.exist;
        State.should.be.a('function');
    });

    it("should create a State with undefined data if no data parameter is specified", function() {

       // Set up a test state
       var testState = State();

        // Verify we got an object with the right keys
       testState.should.be.an('object');
       testState.should.have.all.keys('lm','data');

       // Check the data content
       expect( testState.data ).to.be.undefined;

       // Check the LM
       var components = testState.lm.match(/^LM(\d+)\.(\d+)$/);
       components.should.have.length(3);
    });

    it("should create a new State if given a data parameter", function() {

       // Set up a test state
       var testString = "Some test data";
       var testState = State( testString );

        // Verify we got an object with the right keys
       testState.should.be.an('object');
       testState.should.have.all.keys('lm','data');

       // Check the data content
       testState.data.should.equal( testString );

       // Check the LM
       var components = testState.lm.match(/^LM(\d+)\.(\d+)$/);
       components.should.have.length(3);
    });

    it("should use the lm parameter if it is defined", function() {

       // Set up a test state
       var testLm =  "LM1328113669.00000000000000001";
       var testString = "Some test data";
       var testState = State( testString, testLm );

        // Verify we got an object with the right keys
       testState.should.be.an('object');
       testState.should.have.all.keys('lm','data');

       // Check the data content
       testState.data.should.equal( testString );

       // Check the LM
       testState.lm.should.equal( testLm );
    });
});
