/**
 * File: pprint-rdf-mocha.js
 * Unit tests for scripts/pprint-rdf-mocha.js 
 * NOTE: pprint-rdf.py required python 3 and rdflib be installed on your system
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
var pprintfRdfPath = __dirname + '/../scripts/pprint-rdf.py';

var providerTtlFile = __dirname + "/data/provider.ttl";
var providerJsonldFile = __dirname + "/data/provider.jsonld";

describe("pprint-rdf", function() {

    it("should exist as a file", function() {
        fs.existsSync(pprintfRdfPath).should.be.true;
    });

    it("should be executable", function() {
        commonTest.verifyExecutable(pprintfRdfPath);
    });

    it("should print usage if given no command line arguments", function(done) {
        exec(pprintfRdfPath, function (error, stdout, stderr) {
            error.code.should.equal(2);
            stderr.should.contain("usage: pprint-rdf.py [-h] [-c] file");
            stderr.should.contain("too few arguments");
            done();
        });
    });

  describe("file positional parameter", function() {

      it("should load a JSON-LD file & format as canonical turtle", function(done) {
          var command = pprintfRdfPath + " " + providerJsonldFile;
          exec(command, function (error, stdout, stderr) {
              expect(error).to.be.null;
              stderr.trim().length.should.equal(0);
              stdout.should.contain('@prefix cmumpss: <http://hokukahu.com/schema/cmumpss#> .');
              stdout.should.contain('<urn:local:provider-6>'); 
              stdout.should.contain('    cmumpss:require_supervising_provider-6 true ;'); 
              done();
          });
      });

      it("should load a Turtle file & format as canonical turtle", function(done) {
          var command = pprintfRdfPath + " " + providerTtlFile;
          exec(command, function (error, stdout, stderr) {
              expect(error).to.be.null;
              stderr.trim().length.should.equal(0);
              stdout.should.contain('@prefix ns1: <http://hokukahu.com/schema/cmumpss#> .');
              stdout.should.contain('<urn:local:provider-6>'); 
              stdout.should.contain('    ns1:require_supervising_provider-6 true ;');
              done();
          });
      });
  });

  describe("--cmumps option", function() {

      it("should load a Turtle file with cmumps context prefixes & format as canonical turtle", function(done) {
          var command = pprintfRdfPath + " -c " + providerTtlFile;
          exec(command, function (error, stdout, stderr) {
              expect(error).to.be.null;
              stderr.trim().length.should.equal(0);
              stdout.should.contain('@prefix cmumpss: <http://hokukahu.com/schema/cmumpss#> .');
              stdout.should.contain('<urn:local:provider-6>'); 
              stdout.should.contain('    cmumpss:require_supervising_provider-6 true ;'); 
              done();
          });
      });

  });

});
