/**
 * File: create-state-mocha.js
 * Unit tests for src/create-state.js 
 */

var chai = require('chai');
var should = chai.should();
var expect = chai.expect;

var createState = require('../src/create-state');

describe("create-state", function() {

    it("should exist as a function", function() {
        createState.should.exist;
        createState.should.be.a('function');
    });

    it("should throw an error if no vnid specified", function() {
        expect(createState).to.throw(Error, /Unable to create state because no vnid was provided/);
    });

    it("should throw an error if vnid passed is undefined", function() {
        var vnid;
        expect(createState.bind(this,vnid)).to.throw(Error, /Unable to create state because no vnid was provided/);
    });

    it("should create a new state with undefined data if no data parameter is specified", function() {

       // Set up a test state
       var testVnid = ''; // constant input (IIP)
       var state = createState(testVnid);

        // Verify we got an object with the right keys
       state.should.be.an('object');
       state.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm');

       // Check the content
       state.vnid.should.equal(testVnid);
       expect(state.data).to.be.undefined;
       expect(state.lm).to.be.undefined;
       expect(state.error).to.be.undefined;
       expect(state.stale).to.be.undefined;
       expect(state.groupLm).to.be.undefined;
    });

    it("should create a new state if given an empty vnid & data parameter", function() {

       // Set up a test state
       var testVnid = ''; // constant input (IIP)
       var testString = "Some test data";
       var state = createState(testVnid, testString);

        // Verify we got an object with the right keys
       state.should.be.an('object');
       state.should.have.all.keys('vnid', 'lm','data', 'error','stale', 'groupLm');

       // Check the content
       state.vnid.should.equal(testVnid);
       state.data.should.equal(testString);

       // Check the LM
       var components = state.lm.match(/^LM(\d+)\.(\d+)$/);
       components.should.have.length(3);

       expect(state.error).to.be.undefined;
       expect(state.stale).to.be.undefined;
       expect(state.groupLm).to.be.undefined;
    });

    it("should create a new state if given an non-empty vnid & data parameter", function() {

       // Set up a test state
       var testVnid = '123'; 
       var testString = "Some test data";
       var state = createState(testVnid, testString);

        // Verify we got an object with the right keys
       state.should.be.an('object');
       state.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm');

       // Check the content
       state.vnid.should.equal(testVnid);
       state.data.should.equal(testString);

       // Check the LM
       var components = state.lm.match(/^LM(\d+)\.(\d+)$/);
       components.should.have.length(3);

       expect(state.error).to.be.undefined;
       expect(state.stale).to.be.undefined;
       expect(state.groupLm).to.be.undefined;
    });

    it("should use the lm parameter if it is defined", function() {

       // Set up a test state
       var testVnid = '1';
       var testLm =  'LM1328113669.00000000000000001';
       var testString = "Some test data";
       var state = createState(testVnid, testString, testLm);

        // Verify we got an object with the right keys
       state.should.be.an('object');
       state.should.have.all.keys('vnid', 'lm','data', 'error','stale', 'groupLm');

       // Check the data content
       state.data.should.equal(testString);

       // Check the LM
       state.lm.should.equal(testLm);

       expect(state.error).to.be.undefined;
       expect(state.stale).to.be.undefined;
       expect(state.groupLm).to.be.undefined;
    });

    it("should use the error flag if it is defined", function() {

       // Set up a test state
       var testVnid = '1';
       var testLm =  'LM1328113669.00000000000000001';
       var testString = "Some test data";
       var error = true;
       var state = createState(testVnid, testString, testLm, error);

        // Verify we got an object with the right keys
       state.should.be.an('object');
       state.should.have.all.keys('vnid', 'lm','data', 'error','stale', 'groupLm');

       // Check the data content
       state.data.should.equal(testString);

       // Check the LM
       state.lm.should.equal(testLm);

       state.error.should.be.true;
       expect(state.stale).to.be.undefined;
       expect(state.groupLm).to.be.undefined;
    });
    it("should use the stale flag if it is defined", function() {

       // Set up a test state
       var testVnid = '1';
       var testLm =  'LM1328113669.00000000000000001';
       var testString = "Some test data";
       var error = undefined; 
       var stale = true;
       var state = createState(testVnid, testString, testLm, error, stale);

        // Verify we got an object with the right keys
       state.should.be.an('object');
       state.should.have.all.keys('vnid', 'lm','data', 'error','stale', 'groupLm');

       // Check the data content
       state.data.should.equal(testString);

       // Check the LM
       state.lm.should.equal(testLm);

       expect(state.error).to.be.undefined;
       state.stale.should.be.true;
       expect(state.groupLm).to.be.undefined;
    });
    it("should use both the stale and error flags if defined", function() {

       // Set up a test state
       var testVnid = '1';
       var testLm =  'LM1328113669.00000000000000001';
       var testString = "Some test data";
       var error = true; 
       var stale = true;
       var state = createState(testVnid, testString, testLm, error, stale);

        // Verify we got an object with the right keys
       state.should.be.an('object');
       state.should.have.all.keys('vnid', 'lm','data', 'error','stale', 'groupLm');

       // Check the data content
       state.data.should.equal(testString);

       // Check the LM
       state.lm.should.equal(testLm);

       state.error.should.be.true;
       state.stale.should.be.true;
       expect(state.groupLm).to.be.undefined;
    });

    it("should use groupLm if defined", function() {
       // Set up a test state
       var testVnid = '1';
       var testLm =  'LM1328113669.00000000000000001';
       var groupLm =  'LM1328113669.00000000000000002';
       var testString = "Some test data";
       var state = createState(testVnid, testString, testLm, undefined, undefined, groupLm);

        // Verify we got an object with the right keys
       state.should.be.an('object');
       state.should.have.all.keys('vnid', 'lm','data', 'error','stale', 'groupLm');

       state.vnid.should.equal(testVnid);
       state.data.should.equal(testString);
       expect(state.error).to.be.undefined;
       expect(state.stale).to.be.undefined;

       // Check the LMs
       state.groupLm.should.equal(groupLm);
       state.lm.should.equal(testLm);
    });
});
