/**
 * File: base-file-node-mocha.js
 * Unit tests for the base-node APIs defined in components/base-node.js
 */

var fs = require('fs');

var chai = require('chai');

var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

var basefnode = require('../components/base-file-node');

describe('base-file-node', function() {

  it('base-file-node should exist', function() {
    should.exist( basefnode );
  });

  describe('#defaultStateFilePath', function () {

    it('defaultStateFilePath function should exist in base-file-node exports', function() {
      should.exist( basefnode.defaultStateFilePath );
      basefnode.defaultStateFilePath.should.be.a('function');
    });
   
    it('should use state directory', function() {
      var defaultPath =  basefnode.defaultStateFilePath();
      assert.isTrue( defaultPath.endsWith("/state/"), 
                     'state file path should end with "/state/"');

      if ( process ) { 
        assert( defaultPath.startsWith( process.cwd() ), 
                'state file path should use current working directory');
        }
    });
  });

  describe('#defaultStateFile', function () {
   
    it('defaultStateFile function should exist in base-file-node exports', function() {
      should.exist( basefnode.defaultStateFile );
      basefnode.defaultStateFile.should.be.a('function');
    });

    it('should default to the node name', function() {
      var nodeName = 'MyStateFile';
      var defaultStateFile =  basefnode.defaultStateFile( nodeName );

      assert.isTrue( defaultStateFile.endsWith( nodeName ), 
                     'default state file should use specified node name');

      if ( process ) { 
        assert.isTrue( defaultStateFile.startsWith( process.cwd() ), 
                'state file path should use current working directory');
      }
    });
  });


  describe('#execute', function () {

    it('execute function should exist in base-file-node exports', function() {
      should.exist( basefnode.execute );
      basefnode.execute.should.be.a('function');
    });

    it('should execute "echo Aloha" and write result to state file', function() {
      var nodeName = 'Aloha';
      var payload = { name: nodeName };
      var stateFileName = '/tmp/'+nodeName;

      var command = 'echo '+nodeName;

      basefnode.execute( command,
                         nodeName,
                         stateFileName,
                         null,  // TODO: Add stub for output ports
                         { name: nodeName },
                         function( stateFile, error ) { 
  
                           expect(stateFile).to.equal(stateFileName);
                           expect(error).to.be.a('null');

                           // Verify file exists and has the right content
                           fs.stat(stateFile, function(error, stats) {
                             fs.open(stateFile, "r", function(error, fd) {
                               var buf = new Buffer(stats.size);

                               fs.read(fd, buf, 0, buf.length, null, function(error, bytesRead, buf) {
                                 var data = buf.toString("utf8", 0, buf.length).replace(/\r?\n|\r/,'');
                                 expect(data).to.equal(nodeName);
                                 fs.close(fd);
                                 done();
                               });
                             });
                           });
                         });
    });

  });

  describe('#isJsFile', function () {

    it('isJsFile function should exist in base-file-node exports', function() {
      should.exist( basefnode.isJsFile );
      basefnode.isJsFile.should.be.a('function');
    });

    it('isJsFile should return false for empty file name', function() {
      expect( basefnode.isJsFile('') ).to.be.false;
    });

    it('isJsFile should return false for non-js file name', function() {
      expect( basefnode.isJsFile('test.sh') ).to.be.false;
    });

    it('isJsFile should return false for non-js file name with whitespace', function() {
      expect( basefnode.isJsFile(' test.sh ') ).to.be.false;
    });

    it('isJsFile should return false for js file name used in a command line', function() {
      expect( basefnode.isJsFile('test.sh test.js') ).to.be.false;
    });

    it('isJsFile should return false for file containing .js chars that does not end in .js', function() {
      expect( basefnode.isJsFile('test.js.bak') ).to.be.false;
    });

    it('isJsFile should return true for simple js file name', function() {
      expect( basefnode.isJsFile('test.js') ).to.be.true;
    });

    it('isJsFile should return true for js file name with white space', function() {
      expect( basefnode.isJsFile('  test.js   ') ).to.be.true;
    });
  });

  describe('#uniqElemsWithAttr', function () {

    it('uniqElemsWithAttr function should exist in base-file-node exports', function() {
      should.exist( basefnode.uniqElemsWithAttr );
      basefnode.uniqElemsWithAttr.should.be.a('function');
    });

    it('uniqElemsWithAttr function should return empty list if nothing in array', function() {
      var array = [];
      var attributeName = 'attrName';
      var elements = basefnode.uniqElemsWithAttr( array,
                                                  attributeName );
      expect(elements).to.be.empty; 
    });

    it('uniqElemsWithAttr should return attribute value for a 1 element array', function() {

      var attrValue = 'An Attribute Value';
      var attributeName = 'attrName';
      var testObject = { attrName: attrValue };
      var array = [ testObject ];

      var elements = basefnode.uniqElemsWithAttr( array,
                                                  attributeName );
      expect(elements).to.have.length(1);
      expect(elements).to.deep.equal([attrValue]);
    });

    it('uniqElemsWithAttr should return attribute value for a multi-element array', function() {

      var attrValue = 'An Attribute Value';
      var attributeName = 'attrName';
      var testObject = { attrName: attrValue };

      var otherObject = { anotherName: 'another Object' };
      var array = [ testObject, otherObject ];

      var elements = basefnode.uniqElemsWithAttr( array,
                                                  attributeName );
      expect(elements).to.have.length(1);
      expect(elements).to.deep.equal([attrValue]);
    });

    it('uniqElemsWithAttr should return attribute value for a multi-element array with duplicates', function() {

      var attrValue = 'An Attribute Value';
      var attributeName = 'attrName';
      var testObject = { attrName: attrValue };

      var otherObject = { anotherName: 'another Object' };
      var testObject2 = { attrName: attrValue };

      var array = [ testObject, otherObject, testObject2 ];

      var elements = basefnode.uniqElemsWithAttr( array,
                                                  attributeName );
      expect(elements).to.have.length(1);
      expect(elements).to.deep.equal([attrValue]);
    });

    it('uniqElemsWithAttr should return multiple attribute values for a multi-element array with duplicates', function() {

      var attrValue1 = 'Attribute Value 1';
      var attributeName = 'attrName';
      var testObject = { attrName: attrValue1 };

      var otherObject = { anotherName: 'another Object' };

      var attrValue2 = 'Attribute Value 2';
      var testObject2 = { attrName: attrValue2 };

      var array = [ testObject, otherObject, testObject2 ];

      var elements = basefnode.uniqElemsWithAttr( array,
                                                  attributeName );
      // Check that we got both expected values back
      expect(elements).to.have.length(2);
      assert.include( elements, attrValue1 );
      assert.include( elements, attrValue2 );
    });
  });

  describe('#writeStateFile', function () {

    it('writeStateFile function should exist in base-file-node exports', function() {
      should.exist( basefnode.writeStateFile );
      basefnode.writeStateFile.should.be.a('function');
    });

    it('writeStateFile should create the specified new file', function(done) {

      var stateFileName = '/tmp/myFile';
      var stateToWrite = 'My Test State';

      // delete the file if it exists
      try { 
        fs.unlinkSync(stateFileName); 
      } catch(e) { 
        // keep going
      } 

      basefnode.writeStateFile( stateFileName, 
                                stateToWrite,
                                null,
                                { name: 'TestState' },
                                function(stateFile, error) { 

        expect(stateFile).to.equal(stateFileName);
        expect(error).to.be.a('null');

        // Verify file exists and has the right content
        fs.stat(stateFile, function(error, stats) {
          fs.open(stateFile, "r", function(error, fd) {
            var buf = new Buffer(stats.size);

            fs.read(fd, buf, 0, buf.length, null, function(error, bytesRead, buf) {
              var data = buf.toString("utf8", 0, buf.length).replace(/\r?\n|\r/,'');
              expect(data).to.equal(stateToWrite);
              fs.close(fd);
              done();
            });
          });
        });
      });

    });
 
    it('writeStateFile should fail gracefully with an error if cannot write file', function(done) {

      var stateFileName = '/ACompletelyBogusPath/Bogus'+Math.random()+'/BadFileName';
      var stateToWrite = 'My Test State';
      basefnode.writeStateFile( stateFileName, 
                                stateToWrite,
                                null, // Todo: Add stub for output ports
                                { name: 'TestState' },
                                function(stateFile, error) { 
         expect(error).to.not.equal(null);
         expect(stateFile).to.equal(stateFileName);
         done();
      });
    });
  });

});
