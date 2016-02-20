/**
 * File: framework-mocha.js
 * Unit tests for the framework APIs defined in src/framework.js
 */

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var framework = require('../src/framework');

describe('frameworks', function() {

    it('should exist as an object', function() {
      framework.should.exist;
      framework.should.be.a('object');
    });

});
