/**
 * File: create-state-mocha.js
 * Unit tests for src/create-state.js 
 */

var _ = require('underscore');

var chai = require('chai');
var should = chai.should();
var expect = chai.expect;

var sinon = require('sinon');

var test = require('./common-test');
var stateFactory = require('../src/create-state');
var logger = require('../src/logger');

describe("create-state", function() {

    it("should exist as a function", function() {
        stateFactory.should.exist;
        stateFactory.should.be.a('function');
    });

    it("should throw an error if no vnid specified", function() {
        expect(stateFactory).to.throw(Error, /Unable to create state because no vnid was provided/);
    });

    it("should throw an error if vnid passed is undefined", function() {
        var vnid;
        expect(stateFactory.bind(this,vnid)).to.throw(Error, /Unable to create state because no vnid was provided/);
    });

    it("should create a new state with undefined data if no data parameter is specified", function() {

       // Set up a test state
       var testVnid = ''; // constant input (IIP)
       var state = stateFactory(testVnid);

        // Verify we got an object with the right keys
       state.should.be.an('object');
       state.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 'componentName');

       // Check the content
       state.vnid.should.equal(testVnid);
       expect(state.data).to.be.undefined;
       expect(state.lm).to.be.undefined;
       expect(state.error).to.be.undefined;
       expect(state.stale).to.be.undefined;
       expect(state.groupLm).to.be.undefined;
       state.componentName.should.equal('');
    });

    it("should create a new state if given an empty vnid & data parameter", function() {

       // Set up a test state
       var testVnid = ''; // constant input (IIP)
       var testString = "Some test data";
       var state = stateFactory(testVnid, testString);

        // Verify we got an object with the right keys
       state.should.be.an('object');
       state.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 'componentName');

       // Check the content
       state.vnid.should.equal(testVnid);
       state.data.should.equal(testString);

       // Check the LM
       var components = state.lm.match(/^LM(\d+)\.(\d+)$/);
       components.should.have.length(3);

       expect(state.error).to.be.undefined;
       expect(state.stale).to.be.undefined;
       expect(state.groupLm).to.be.undefined;
       state.componentName.should.equal('');
    });

    it("should create a new state if given an non-empty vnid & data parameter", function() {

       // Set up a test state
       var testVnid = '123'; 
       var testString = "Some test data";
       var state = stateFactory(testVnid, testString);

        // Verify we got an object with the right keys
       state.should.be.an('object');
       state.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 'componentName');

       // Check the content
       state.vnid.should.equal(testVnid);
       state.data.should.equal(testString);

       // Check the LM
       var components = state.lm.match(/^LM(\d+)\.(\d+)$/);
       components.should.have.length(3);

       expect(state.error).to.be.undefined;
       expect(state.stale).to.be.undefined;
       expect(state.groupLm).to.be.undefined;
       state.componentName.should.equal('');
    });

    it("should use the lm parameter if it is defined", function() {

       // Set up a test state
       var testVnid = '1';
       var testLm =  'LM1328113669.00000000000000001';
       var testString = "Some test data";
       var state = stateFactory(testVnid, testString, testLm);

        // Verify we got an object with the right keys
       state.should.be.an('object');
       state.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 'componentName');

       // Check the data content
       state.data.should.equal(testString);

       // Check the LM
       state.lm.should.equal(testLm);

       expect(state.error).to.be.undefined;
       expect(state.stale).to.be.undefined;
       expect(state.groupLm).to.be.undefined;
       state.componentName.should.equal('');
    });

    it("should use the error flag if it is defined", function() {

       // Set up a test state
       var testVnid = '1';
       var testLm =  'LM1328113669.00000000000000001';
       var testString = "Some test data";
       var error = true;
       var state = stateFactory(testVnid, testString, testLm, error);

        // Verify we got an object with the right keys
       state.should.be.an('object');
       state.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 'componentName');

       // Check the data content
       state.data.should.equal(testString);

       // Check the LM
       state.lm.should.equal(testLm);

       state.error.should.be.true;
       expect(state.stale).to.be.undefined;
       expect(state.groupLm).to.be.undefined;
       state.componentName.should.equal('');
    });
    it("should use the stale flag if it is defined", function() {

       // Set up a test state
       var testVnid = '1';
       var testLm =  'LM1328113669.00000000000000001';
       var testString = "Some test data";
       var error = undefined; 
       var stale = true;
       var state = stateFactory(testVnid, testString, testLm, error, stale);

        // Verify we got an object with the right keys
       state.should.be.an('object');
       state.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 'componentName');

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
       var state = stateFactory(testVnid, testString, testLm, error, stale);

        // Verify we got an object with the right keys
       state.should.be.an('object');
       state.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 'componentName');

       // Check the data content
       state.data.should.equal(testString);

       // Check the LM
       state.lm.should.equal(testLm);

       state.error.should.be.true;
       state.stale.should.be.true;
       expect(state.groupLm).to.be.undefined;
       state.componentName.should.equal('');
    });

    it("should use groupLm if defined", function() {
       // Set up a test state
       var testVnid = '1';
       var testLm =  'LM1328113669.00000000000000001';
       var groupLm =  'LM1328113669.00000000000000002';
       var testString = "Some test data";
       var state = stateFactory(testVnid, testString, testLm, undefined, undefined, groupLm);

        // Verify we got an object with the right keys
       state.should.be.an('object');
       state.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 'componentName');

       state.vnid.should.equal(testVnid);
       state.data.should.equal(testString);
       expect(state.error).to.be.undefined;
       expect(state.stale).to.be.undefined;

       // Check the LMs
       state.groupLm.should.equal(groupLm);
       state.lm.should.equal(testLm);
       state.componentName.should.equal('');
    });

    it("should set component name if  defined", function() {
       // Set up a test state
       var testVnid = '1';
       var testLm =  'LM1328113669.00000000000000001';
       var groupLm =  'LM1328113669.00000000000000002';
       var testString = "Some test data";
       var componentName = "rdf/Cheers";
       var state = stateFactory(testVnid, testString, testLm, undefined, undefined, groupLm, componentName);

        // Verify we got an object with the right keys
       state.should.be.an('object');
       state.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 'componentName');

       state.vnid.should.equal(testVnid);
       state.data.should.equal(testString);
       expect(state.error).to.be.undefined;
       expect(state.stale).to.be.undefined;

       // Check the LMs
       state.groupLm.should.equal(groupLm);
       state.lm.should.equal(testLm);
       state.componentName.should.equal(componentName);
    });

    it("State object default keys should match exported STATE_KEYS", function() {
        var state = stateFactory('');
        Object.keys(state).should.deep.equal(stateFactory.STATE_KEYS); 
    });

  });

  describe("state metadata APIs", function() {

    describe("#addMetadata", function() {
        it("should throw an error if no parameter is provided", function() {
            expect(stateFactory.addMetadata).to.throw(Error, 
                   /AddMetadata API requires an object with the attributes to be added!/);
        });

        it("should warn if undefined state was provided", function(done) {
            sinon.stub(logger, 'warn').callsFake(function(message) {
                // Should get warning message 
                if (message === 'Attempted to add metadata to an invalid state.')
                    done();
                else 
                    throw Error('Unexpected warning message:',message);
            });
            stateFactory.addMetadata(undefined, {id: "Charlie Chaplin"});
            logger.warn.restore();
        });

        it("should warn if empty state was provided", function(done) {
            sinon.stub(logger, 'warn').callsFake(function(message) {
                // Should get warning message 
                if (message === 'Attempted to add metadata to an invalid state.')
                    done();
                else 
                    throw Error('Unexpected warning message:',message);
            });
            stateFactory.addMetadata({}, {id: "Buster Keaton"});
            logger.warn.restore();
        });

        it("should add a single metadata attribute to a valid state", function() {
            // Set up a test state
            var testVnid = ''; // constant input (IIP)
            var testString = "The Little Tramp";
            var state = stateFactory(testVnid, testString);
            state.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 
                                       'groupLm', 'componentName');
            test.verifyState(state, '', testString);
            state.componentName.should.equal('');

            var id = 'Charlie Chaplin';
            stateFactory.addMetadata(state, {id: id});
            test.verifyState(state, '', testString);
            state.id.should.equal(id);
        });

        it("should add multiple metadata attributes to a valid state", function() {
            // Set up a test state
            var testVnid = ''; // constant input (IIP)
            var testString = "Who's on First?";
            var state = stateFactory(testVnid, testString);
            state.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 
                                       'groupLm', 'componentName');
            test.verifyState(state, '', testString);
            state.componentName.should.equal('');

            var id1 = 'Abbott';
            var id2 = 'Costello';
            stateFactory.addMetadata(state, {id1: id1, id2: id2});
            test.verifyState(state, '', testString);
            state.id1.should.equal(id1);
            state.id2.should.equal(id2);
        });
    });

    describe("#clearMetadata", function() {

        it("should not change the state if there is no metadata to clear", function() {
            // Set up a test state
            var testVnid = ''; // constant input (IIP)
            var testString = "Some test data";
            var state = stateFactory(testVnid, testString);
            state.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 'componentName');
            test.verifyState(state, '', testString);
            state.componentName.should.equal('');

            stateFactory.clearMetadata(state);
            state.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 'componentName');
            test.verifyState(state, '', testString);
            state.componentName.should.equal('');
        });

        it("should clear a single metadata item from state", function() {
            // Set up a test state
            var testVnid = ''; // constant input (IIP)
            var testString = "Some test data";
            var state = stateFactory(testVnid, testString);
            test.verifyState(state, '', testString);
            state.componentName.should.equal('');

            // Add some metadata to the state
            var patientId = 1;
            _.extend(state, {patientId: patientId});
            state.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 
                                       'componentName', 'patientId');
            test.verifyState(state, '', testString);
            state.componentName.should.equal('');
            state.patientId.should.equal(patientId);

            stateFactory.clearMetadata(state);
            test.verifyState(state, '', testString);
            state.componentName.should.equal('');
            state.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 'componentName');
        });

        it("should clear multiple metadata items from state", function() {
            // Set up a test state
            var testVnid = ''; // constant input (IIP)
            var testString = "Some test data";
            var state = stateFactory(testVnid, testString);
            test.verifyState(state, '', testString);
            state.componentName.should.equal('');

            // Add some metadata to the state
            var patientId = 1;
            var testId = 'two';
            _.extend(state, {patientId: patientId, testId: testId});
            state.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 
                                       'componentName', 'patientId', 'testId');
            test.verifyState(state, '', testString);
            state.componentName.should.equal('');
            state.patientId.should.equal(patientId);
            state.testId.should.equal(testId);

            stateFactory.clearMetadata(state);
            test.verifyState(state, '', testString);
            state.componentName.should.equal('');
            state.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 'componentName');
        });
    });

    describe("#copyMetadata", function() {

        it("should not change the to state if there is no metadata to copy", function() {
            // Set up a test from state
            var testVnid1 = '1'; // constant input (IIP)
            var testString1 =  "um";
            var fromState = stateFactory(testVnid1, testString1);
            fromState.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 'componentName');
            test.verifyState(fromState, testVnid1, testString1);
            fromState.componentName.should.equal('');

            // Set up a test to state
            var testVnid2 = '2'; // constant input (IIP)
            var testString2 = "dois";
            var toState = stateFactory(testVnid2, testString2);
            toState.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 'componentName');
            test.verifyState(toState, testVnid2, testString2);
            toState.componentName.should.equal('');

            stateFactory.copyMetadata(fromState, toState);
            fromState.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 'componentName');
            toState.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 'componentName');
            test.verifyState(fromState, testVnid1, testString1);
            test.verifyState(toState, testVnid2, testString2);
            fromState.componentName.should.equal('');
            toState.componentName.should.equal('');
        });

        it("should copy a single metadata item from state", function() {
            // Set up a test from state with metadata
            var testVnid1 = '1'; // constant input (IIP)
            var testString1 =  "um";
            var patientId = '2-000007';
            var fromState = stateFactory(testVnid1, testString1);
            _.extend(fromState, {patientId: patientId}); // add metadata
            fromState.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 'componentName', 'patientId');
            test.verifyState(fromState, testVnid1, testString1);
            fromState.patientId.should.equal(patientId);
            fromState.componentName.should.equal('');

            // Set up a test to state
            var testVnid2 = '2'; // constant input (IIP)
            var testString2 = "dois";
            var toState = stateFactory(testVnid2, testString2);
            toState.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 'componentName');
            test.verifyState(toState, testVnid2, testString2);
            toState.componentName.should.equal('');

            stateFactory.copyMetadata(fromState, toState);
            fromState.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 'componentName', 'patientId');
            toState.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 'componentName', 'patientId');
            test.verifyState(fromState, testVnid1, testString1);
            test.verifyState(toState, testVnid2, testString2);
            fromState.componentName.should.equal('');
            toState.componentName.should.equal('');
            fromState.patientId.should.equal(patientId);
            toState.patientId.should.equal(patientId);
        });

        it("should copy multiple metadata items from state", function() {
            // Set up a test from state with metadata
            var testVnid1 = '1'; // constant input (IIP)
            var testString1 =  "um";
            var patientId = '2-000007';
            var patientName = 'Bugsie';
            var fromState = stateFactory(testVnid1, testString1);
            _.extend(fromState, {patientId: patientId, patientName: patientName}); // add metadata
            fromState.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 
                                           'componentName', 'patientId', 'patientName');
            test.verifyState(fromState, testVnid1, testString1);
            fromState.patientId.should.equal(patientId);
            fromState.componentName.should.equal('');

            // Set up a test to state
            var testVnid2 = '2'; // constant input (IIP)
            var testString2 = "dois";
            var toState = stateFactory(testVnid2, testString2);
            toState.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 'componentName');
            test.verifyState(toState, testVnid2, testString2);
            toState.componentName.should.equal('');

            stateFactory.copyMetadata(fromState, toState);
            fromState.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 
                                           'componentName', 'patientId', 'patientName');
            toState.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 
                                         'componentName', 'patientId', 'patientName');
            test.verifyState(fromState, testVnid1, testString1);
            test.verifyState(toState, testVnid2, testString2);
            fromState.componentName.should.equal('');
            toState.componentName.should.equal('');
            fromState.patientId.should.equal(patientId);
            toState.patientId.should.equal(patientId);
            fromState.patientName.should.equal(patientName);
            toState.patientName.should.equal(patientName);
        });

        it("should not affect other metadata in target state", function() {
            // Set up a test from state with metadata
            var testVnid1 = '1'; // constant input (IIP)
            var testString1 =  "um";
            var patientId = '2-000007';
            var patientName = 'Bugsie';
            var fromState = stateFactory(testVnid1, testString1);
            _.extend(fromState, {patientId: patientId, patientName: patientName}); // add metadata
            fromState.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 
                                           'componentName', 'patientId', 'patientName');
            test.verifyState(fromState, testVnid1, testString1);
            fromState.patientId.should.equal(patientId);
            fromState.componentName.should.equal('');

            // Set up a test to state
            var testVnid2 = '2'; // constant input (IIP)
            var testString2 = "dois";
            var doctorId = '99-12345';
            var toState = stateFactory(testVnid2, testString2);
            _.extend(toState, {doctorId: doctorId}); // add metadata
            toState.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 'componentName', 'doctorId');
            test.verifyState(toState, testVnid2, testString2);
            toState.componentName.should.equal('');

            stateFactory.copyMetadata(fromState, toState);
            fromState.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 
                                           'componentName', 'patientId', 'patientName');
            toState.should.have.all.keys('vnid', 'lm','data', 'error', 'stale', 'groupLm', 
                                         'componentName', 'patientId', 'patientName', 'doctorId');
            test.verifyState(fromState, testVnid1, testString1);
            test.verifyState(toState, testVnid2, testString2);
            fromState.componentName.should.equal('');
            toState.componentName.should.equal('');
            fromState.patientId.should.equal(patientId);
            toState.patientId.should.equal(patientId);
            fromState.patientName.should.equal(patientName);
            toState.patientName.should.equal(patientName);
            toState.doctorId.should.equal(doctorId);
        });

    });
});
