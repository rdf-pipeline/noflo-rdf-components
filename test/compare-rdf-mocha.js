/**
 * File: compare-rdf-mocha.js
 * Unit tests for scripts/compare-rdf-mocha.js 
 * NOTE: compare-rdf.py required python 3 and rdflib be installed on your system
 *       These tests will fail if they are not. 
 */

var _ = require('underscore');

var chai = require('chai');
var should = chai.should();
var expect = chai.expect;

var exec = require('child_process').exec;
var fs = require('fs');
var os = require('os');

var commonTest = require('./common-test.js');

var outputDir = os.tmpdir()+"/test";
var compareRdfPath = __dirname + '/../scripts/compare-rdf.py';

var providerTtlFile = __dirname + "/data/provider.ttl";
var providerJsonldFile = __dirname + "/data/provider.jsonld";

describe("compare-rdf", function() {

    it("should exist as a file", function() {
        fs.existsSync(compareRdfPath).should.be.true;
    });

    it("should be executable", function() {
        commonTest.verifyExecutable(compareRdfPath);
    });

    it("should print usage if given no command line arguments", function(done) {
        exec(compareRdfPath, function (error, stdout, stderr) {
            error.code.should.equal(2);
            stderr.should.contain("usage: compare-rdf.py [-h] [-c] [-v] file1 file2");
            stderr.should.contain("too few arguments");
            done();
        });
    });

  describe("file positional parameters", function() {

      it("should load two JSON-LD files and compare them", function(done) {
          var command = compareRdfPath + " " + providerJsonldFile + " " + providerJsonldFile;
          exec(command, function (error, stdout, stderr) {
               expect(error).to.be.null;
               stderr.trim().length.should.equal(0);
              stdout.should.contain('matches!'); 
              done();
          });
      });

      it("should load two TTL files and compare them", function(done) {
          var command = compareRdfPath + " " + providerTtlFile + " " + providerTtlFile;
          exec(command, function (error, stdout, stderr) {
               expect(error).to.be.null;
               stderr.trim().length.should.equal(0);
              stdout.should.contain('matches!'); 
              done();
          });
      });

      it("should load a JSON-LD file & TTL file and compare them", function(done) {
          var command = compareRdfPath + " " + providerJsonldFile + " " + providerTtlFile;
          exec(command, function (error, stdout, stderr) {
               expect(error.code).to.equal(1);
              stderr.should.contain('does NOT match!'); 
              done();
          });
      });

  });

  describe("--cmumps option", function() {

      it("should load a JSON-LD file & a Turtle file with cmumps context prefixes & compare them", function(done) {
          var command = compareRdfPath + " -c " + providerTtlFile + " " + providerJsonldFile
          exec(command, function (error, stdout, stderr) {
              expect(error).to.be.null;
              stderr.trim().length.should.equal(0);
              stdout.should.contain('matches!'); 
              done();
          });
      });

  });

});
