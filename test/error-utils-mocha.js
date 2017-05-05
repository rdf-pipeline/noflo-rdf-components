// error-utils-mocha.js

var _ = require('underscore');

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var errorUtils = require('../components/lib/error-utils');

var logger = require("../src/logger");
var test = require('./common-test');

describe("error-utils", function() {

    it("should exist as an object", function() {
        errorUtils.should.exist;
        errorUtils.should.be.an('object');

        // verified expects API is there
        errorUtils.errorMessage.should.be.a('function');
    });

    describe("#errorMessage", function() {

        it("should print a default error message and return a default Error if nothing is passed", function() {
            var loggerCalled = false;

            sinon.stub(logger,'error', function(message, e) {
                errorUtils.defaultMessage.should.deep.equal(message);
                expect(e).to.be.undefined;
                loggerCalled = true;
            });

            var result = errorUtils.errorMessage();

            logger.error.restore();
            loggerCalled.should.be.true;
            result.should.deep.equal(Error('An error was detected'));
        });

        it("should print the specified error message and return it in a JavaScript Error", function() {

            var msg = "Oh, what a beautiful morning";
            var loggerCalled = false;

            sinon.stub(logger,'error', function(message, e) {
                msg.should.deep.equal(message);
                expect(e).to.be.undefined;
                loggerCalled = true;
            });

            var result = errorUtils.errorMessage(msg);

            logger.error.restore();
            loggerCalled.should.be.true;
            result.should.deep.equal(Error(msg));
        });

        it("should print the specified error message and JavaScript Error and return a new JavaScript Error", function() {

            var msg = "Oh, what a beautiful morning";
            var errMsg = "Gone to hell in a handbasket";
            var err = Error(errMsg);
            var loggerCalled = false;

            sinon.stub(logger,'error', function(message, e) {
                var expected = msg + '\n';
                expected.should.deep.equal(message);
                e.should.deep.equal(err);
                loggerCalled = true;
            });

            var result = errorUtils.errorMessage(msg, err);

            logger.error.restore();
            loggerCalled.should.be.true;
            result.should.deep.equal(Error(msg + '\n' + errMsg));
        });

        it("should gracefully handle an empty Error", function() {

            var msg = "Zip-a-dee-doo-dah!";
            var err = Error();
            var loggerCalled = false;

            sinon.stub(logger,'error', function(message, e) {
                var expected = msg + '\n';
                expected.should.deep.equal(message);
                e.should.deep.equal(Error()); 
                loggerCalled = true;
            });

            var result = errorUtils.errorMessage(msg, err);

            logger.error.restore();
            loggerCalled.should.be.true;
            result.should.deep.equal(Error(msg));
        });

        it("should gracefully handle a non-Error", function() {

            var msg = "Zip-a-dee-doo-dah!";
            var err = "zip-a-dee-ay!";
            var loggerCalled = false;

            sinon.stub(logger,'error', function(message, e) {
                msg.should.deep.equal(message);
                expect(e).to.be.undefined;
                loggerCalled = true;
            });

            var result = errorUtils.errorMessage(msg, err);

            logger.error.restore();
            loggerCalled.should.be.true;
            result.should.deep.equal(Error(msg));
        });
    });

});
