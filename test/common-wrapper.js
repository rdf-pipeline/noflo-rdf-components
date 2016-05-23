/**
 * File: common-wrapper.js
 * 
 * Common unit tests for all noflo rdf pipeline wrappers 
 */

var chai = require('chai');

var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

var _ = require('underscore');

var commonTest = require('./common-test');

module.exports = function(wrapper, defNumPorts) { 

    describe('Common wrapper tests', function() {
        it('should exist as a function', function() {
            wrapper.should.exist;
            wrapper.should.be.a('function');
        });

        it("should use default port & default updater if no node definition", function() {
            return Promise.resolve()
            .then(wrapper).then(commonTest.createComponent).then(function(component){
                return _.keys(component.inPorts);
            // Verify we get one port back (length 1) - don't worry about what it's name is
            // since that may vary from wrapper to wrapper
            }).should.eventually.have.length(defNumPorts);
        });

        it("should use default port & default updater if empty node definition", function() {
            return Promise.resolve({})
            .then(wrapper).then(commonTest.createComponent).then(function(component){
                return _.keys(component.inPorts);
            }).should.eventually.have.length(defNumPorts);
        });

        it("should use default port & default updater if empty inPorts", function() {
            return Promise.resolve({inPorts:{}})
            .then(wrapper).then(commonTest.createComponent).then(function(component){
                return _.keys(component.inPorts);
            }).should.eventually.have.length(defNumPorts);
        });

        it("should accept array of inPort names", function() {
            return Promise.resolve({
                inPorts:['testport']
            }).then(wrapper).then(commonTest.createComponent).then(function(component){
                return _.keys(component.inPorts);
            // Verify we get two ports - the one defaulted for default updater, and this test port
            }).should.eventually.have.length(defNumPorts+1);
        });

        it("should accept object with one inPort definition", function() {
            return Promise.resolve({
                inPorts: { 
                    myinput: { datatype: 'string', 
                               description: "my input description",
                               required: true }
                },
                updater: function(myinput) {
                             handler('success');
                }
            }).then(wrapper).then(commonTest.createComponent).then(function(component){
                return _.keys(component.inPorts);
            }).should.eventually.become([ 'myinput' ]);
        });
    
    });
}
