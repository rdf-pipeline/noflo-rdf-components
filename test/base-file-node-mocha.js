/**
 * File: base-file-node-mocha.js
 * Unit tests for the base-file-node APIs defined in src/base-file-node.js
 */

var fs = require('fs');
var child_process = require('child_process');

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var basefnode = require('../src/base-file-node');

describe('base-file-node', function() {

  it('should exist as an object', function() {
    basefnode.should.exist;
    basefnode.should.be.an('object');
  });

  describe('#defaultStateFilePath', function () {

    it('should exist in base-file-node exports', function() {
      basefnode.defaultStateFilePath.should.exist;
      basefnode.defaultStateFilePath.should.be.a('function');
    });
   
    it('should use state directory', function() {
      var defaultPath =  basefnode.defaultStateFilePath();
      defaultPath.endsWith('/state/').should.be.true;
      defaultPath.startsWith( process.cwd() ).should.be.true;
    });
  });

  describe('#defaultStateFile', function () {
   
    it('should exist in base-file-node exports', function() {
      basefnode.defaultStateFile.should.exist;
      basefnode.defaultStateFile.should.be.a('function');
    });

    it('should default to the node name', function() {
      var nodeName = 'MyStateFile';
      var defaultStateFile =  basefnode.defaultStateFile( nodeName );

      defaultStateFile.endsWith( nodeName ).should.be.true;
      defaultStateFile.startsWith( process.cwd() ).should.be.true; 

    });
  });

  describe('#execute', function () {

    beforeEach(function(done) {
      // Set up an outputPort variable we can use for testing 
      outputPorts = { error: {
                       disconnect: function() {},
                       send: function() {}
                     },
                     out: {
                       disconnect: function() {},
                       send: function() {}
                     }
                    };

      // Set up sinon stubs on the APIs so we can verify they
      // got called when they should and didn't when they should not
      sinon.stub(outputPorts.out, 'disconnect');
      sinon.stub(outputPorts.out, 'send');
      sinon.stub(outputPorts.error, 'disconnect');
      sinon.stub(outputPorts.error, 'send');
      done();
    });

    afterEach(function(done) {
      // Cleanup stubs
      outputPorts.out.disconnect.restore();
      outputPorts.out.send.restore();
      outputPorts.error.disconnect.restore();
      outputPorts.error.send.restore();
      delete outputPorts;
      done();
    });

    it('should exist in base-file-node exports', function() {
      should.exist( basefnode.execute );
      basefnode.execute.should.be.a('function');
    });

    it('should execute "echo Aloha" and write result to state file', function(done) {
      var nodeName = 'Aloha';
      var payload = { name: nodeName };
      var stateFileName = '/tmp/'+nodeName;

      var command = 'echo '+nodeName;

      basefnode.execute( command,
                         nodeName,
                         stateFileName,
                         outputPorts,  
                         { name: nodeName },
                         function( error, stateFile ) { 
  
                           stateFile.should.equal(stateFileName);
                           expect(error).to.be.null;

                           outputPorts.error.send.called.should.be.false;
                           outputPorts.error.disconnect.called.should.be.false;

                           outputPorts.out.send.called.should.be.true;
                           outputPorts.out.disconnect.called.should.be.true;

                           // Verify file exists and has the right content
                           fs.stat(stateFile, function(error, stats) {
                             fs.open(stateFile, 'r', function(error, fd) {
                               var buf = new Buffer(stats.size);

                               fs.read(fd, buf, 0, buf.length, null, function(err, bytesRead, buf) {
                                 var data = buf.toString('utf8', 0, buf.length).replace(/\r?\n|\r/,'');
                                 data.should.equal(nodeName);
                                 fs.close(fd);
                                 done();
                               });
                             });
                           });
                         });
    });

    it('should fail gracefully after attempting to execute an ls of a non-existent directory', function(done) {
      var nodeName = 'TestNode';
      var command = 'ls /ACompletelyBogusPath/Bogus'+Math.random()+'/BadFileName';

      basefnode.execute( command,
                         nodeName,
                         null,  // pass no state file 
                         outputPorts,  
                         { name: nodeName },
                         function( error, stateFile ) { 
  
                           expect(stateFile).to.be.null;
                           error.should.not.be.null;

                           outputPorts.error.send.called.should.be.true;
                           outputPorts.error.disconnect.called.should.be.true;

                           outputPorts.out.send.called.should.be.false;
                           outputPorts.out.disconnect.called.should.be.false;

                           done();
                         });
    });

    it('should fail gracefully with no callback', function() {
      var nodeName = 'TestCbNode';
      var command = 'ls /ACompletelyBogusPath/Bogus'+Math.random()+'/BadFileName';

      expect( basefnode.execute( command,
                                 nodeName,
                                 null,  // pass no state file 
                                 outputPorts,  
                                 { name: nodeName }) ).to.not.throw.error; 
    }); 

    it('should gracefully exit if there is no stdout', function(done) {
      var nodeName = 'TestNode';
      var command = 'ls &> /dev/null';
      var stateFilePath = '/tmp/NoStdout';

      basefnode.execute( command,
                         nodeName,
                         stateFilePath, 
                         outputPorts,
                         { name: nodeName },
                         function( error, stateFile ) {

                           expect(stateFile).to.not.be.null;
                           expect(error).to.be.null;

                           outputPorts.error.send.called.should.be.false;
                           outputPorts.error.disconnect.called.should.be.false;

                           outputPorts.out.send.called.should.be.true;
                           outputPorts.out.disconnect.called.should.be.true;

                           // verify that state file does not exist since no state
                           fs.stat(stateFile, function(error, stats) {
                              expect(stats).to.be.undefined; 
                              done();
                           });
                         });
    });

    it('should log messages to console when debug is enabled', function(done) {

      // Set up a console.log stub with a function to track what is logged
      var logBuffer = '';
      sinon.stub( console, 'log', function (message) {
        logBuffer += message;
      });

      // Turn on debug tracing to test that path
      basefnode.debug = true;

      var nodeName = 'TestNode';
      var command = 'ls';

      basefnode.execute( command,
                         nodeName,
                         null,  // pass no state file 
                         outputPorts,  
                         { name: nodeName }, // send payload
                         function( error, stateFile ) { 

        // Verify that we got the expected console log message
        logBuffer.should.equal('Executing command ls for node TestNode');
 
        // clean up and reset state to original 
        basefnode.debug = false; 
        console.log.restore();

        done();
      });
    });

  });

  describe('#handleErrors', function () {
    beforeEach(function() {
      // Set up an outputPort variable we can use for testing 
      outputPorts = { error: {
                       disconnect: function() {},
                       send: function() {}
                     }
                    };

      // Set up sinon stubs on the APIs so we can verify they
      // got called when they should and didn't when they should not
      sinon.stub(outputPorts.error, 'disconnect');
      sinon.stub(outputPorts.error, 'send');
    });

    afterEach(function() {
      // Cleanup stubs
      outputPorts.error.disconnect.restore();
      outputPorts.error.send.restore();
      delete outputPorts;
    });

    it('should exist in base-file-node exports', function() {
      basefnode.handleErrors.should.exist;
      basefnode.handleErrors.should.be.a('function');
    });

    it('should do nothing when passed null errors array', function() {
      expect( basefnode.handleErrors(null, outputPorts)).to.not.throw.error;
      outputPorts.error.send.called.should.be.false;
      outputPorts.error.disconnect.called.should.be.false;
    });

    it('should do nothing when passed no errors', function() {
      expect( basefnode.handleErrors([], outputPorts)).to.not.throw.error;
      outputPorts.error.send.called.should.be.false;
      outputPorts.error.disconnect.called.should.be.false;
    });

    it('should send errors and disconnect when called with a one element error array', function() {
      expect( basefnode.handleErrors([ new Error('Test Error') ], outputPorts)).to.not.throw.error;
      outputPorts.error.send.called.should.be.true;
      outputPorts.error.disconnect.called.should.be.true;
    });
  });

  describe('#isJsFile', function () {

    it('should exist in base-file-node exports', function() {
      basefnode.isJsFile.should.exist;
      basefnode.isJsFile.should.be.a('function');
    });

    it('should return false for empty file name', function() {
      basefnode.isJsFile('').should.be.false;
    });

    it('should return false for non-js file name', function() {
      basefnode.isJsFile('test.sh').should.be.false;
    });

    it('should return false for non-js file name with whitespace', function() {
      basefnode.isJsFile(' test.sh ').should.be.false;
    });

    it('should return false for js file name used in a command line', function() {
      basefnode.isJsFile('test.sh test.js').should.be.false;
    });

    it('should return false for file containing .js chars that does not end in .js', function() {
      basefnode.isJsFile('test.js.bak').should.be.false;
    });

    it('should return true for simple js file name', function() {
      basefnode.isJsFile('test.js').should.be.true;
    });

    it('should return true for js file name with white space', function() {
      basefnode.isJsFile('  test.js   ').should.be.true;
    });
  });

  describe('#uniqElemsWithAttr', function () {

    it('should exist in base-file-node exports', function() {
      basefnode.uniqElemsWithAttr.should.exist;
      basefnode.uniqElemsWithAttr.should.be.a('function');
    });

    it('should log messages to console when debug is enabled', function() {

      // Set up a console.log stub with a function to track what is logged
      var logBuffer = '';
      sinon.stub( console, 'log', function (message) {
        logBuffer += message;
      });

      // Turn on debug tracing to test that path
      basefnode.debug = true;

      // Try it with an empty array
      var array = [];
      var attributeName = 'attrName';
      basefnode.uniqElemsWithAttr( array,
                                   attributeName );

      logBuffer.should.equal('Unique elements with attribute attrName: ');

      // clean up and reset state to original 
      basefnode.debug = false; 
      console.log.restore();
    });

    it('should return empty list if nothing in array', function() {
      var array = [];
      var attributeName = 'attrName';
      var elements = basefnode.uniqElemsWithAttr( array,
                                                  attributeName );
      elements.should.be.empty; 
    });

    it('should return attribute value for a 1 element array', function() {

      var attrValue = 'An Attribute Value';
      var attributeName = 'attrName';
      var testObject = { attrName: attrValue };
      var array = [ testObject ];

      var elements = basefnode.uniqElemsWithAttr( array,
                                                  attributeName );
      elements.should.have.length(1);
      elements.should.deep.equal([attrValue]);
    });

    it('should return attribute value for a multi-element array', function() {

      var attrValue = 'An Attribute Value';
      var attributeName = 'attrName';
      var testObject = { attrName: attrValue };

      var otherObject = { anotherName: 'another Object' };
      var array = [ testObject, otherObject ];

      var elements = basefnode.uniqElemsWithAttr( array,
                                                  attributeName );
      elements.should.have.length(1);
      elements.should.deep.equal([attrValue]);
    });

    it('should return attribute value for a multi-element array with duplicates', function() {

      var attrValue = 'An Attribute Value';
      var attributeName = 'attrName';
      var testObject = { attrName: attrValue };

      var otherObject = { anotherName: 'another Object' };
      var testObject2 = { attrName: attrValue };

      var array = [ testObject, otherObject, testObject2 ];

      var elements = basefnode.uniqElemsWithAttr( array,
                                                  attributeName );
      elements.should.have.length(1);
      elements.should.deep.equal([attrValue]);
    });

    it('should return multiple attribute values for a multi-element array with duplicates', function() {

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
      elements.should.have.length(2);
      elements.should.contain( attrValue1 );
      elements.should.contain( attrValue2 );
    });
  });

  describe('#writeStateFile', function () {

    beforeEach(function(done) {
      // Set up an outputPort variable we can use for testing 
      outputPorts = { error: {
                       disconnect: function() {},
                       send: function() {}
                     },
                     out: {
                       disconnect: function() {},
                       send: function() {}
                     }
                    };

      // Set up sinon stubs on the APIs so we can verify they
      // got called when they should and didn't when they should not
      // This will not actually call the methods we are stubbing
      sinon.stub(outputPorts.out, 'disconnect');
      sinon.stub(outputPorts.out, 'send');
      sinon.stub(outputPorts.error, 'disconnect');
      sinon.stub(outputPorts.error, 'send');
      done();
    });

    afterEach(function(done) {
      // Cleanup stubs
      outputPorts.out.disconnect.restore();
      outputPorts.out.send.restore();
      outputPorts.error.disconnect.restore();
      outputPorts.error.send.restore();
      delete outputPorts;
      done();
    });

    it('writeStateFile function should exist in base-file-node exports', function() {
      basefnode.writeStateFile.should.exit;
      basefnode.writeStateFile.should.be.a('function');
    });

    it('should log messages to console when debug is enabled', function(done) {

      // Set up a console.log stub with a function to track what is logged
      var logBuffer = '';
      sinon.stub( console, 'log', function (message) {
        logBuffer += message;
      });

      // Turn on debug tracing to test that path
      basefnode.debug = true;

      var stateFileName = '/tmp/consoleLogTest';
      var stateToWrite = 'Console Log Test State';
      basefnode.writeStateFile( stateFileName, 
                                stateToWrite,
                                outputPorts,
                                { name: 'ConsoleLogTest' },
                                function(error, stateFile) { 
       
        // Verify that we got the expected console log message
        logBuffer.should.equal('Saving state to /tmp/consoleLogTest');
 
        // clean up and reset state to original 
        basefnode.debug = false; 
        console.log.restore();
        fs.unlinkSync(stateFile); 

        done();
      });
    });

    it('should create the specified new file', function(done) {

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
                                outputPorts,
                                { name: 'TestState' },
                                function(error, stateFile) { 

        stateFile.should.equal(stateFileName);
        expect(error).to.be.null;

        outputPorts.error.send.called.should.be.false;
        outputPorts.error.disconnect.called.should.be.false;

        outputPorts.out.send.called.should.be.true;
        outputPorts.out.disconnect.called.should.be.true;

        // Verify file exists and has the right content
        fs.stat(stateFile, function(error, stats) {
          fs.open(stateFile, 'r', function(error, fd) {
            var buf = new Buffer(stats.size);

            fs.read(fd, buf, 0, buf.length, null, function(error, bytesRead, buf) {
              var data = buf.toString('utf8', 0, buf.length).replace(/\r?\n|\r/,'');
              data.should.equal(stateToWrite);
              fs.close(fd);

              // clean up 
              fs.unlinkSync(stateFile); 
              done();
            });
          });
        });
      });

    });
 
    it('should execute without a callback function', function() {

      // Set up a write File stub so we can force it to return immediately
      // and can test if we execute with errors when there is no callback
      // passed into writeStateFile below
      sinon.stub( fs, 'writeFile', function( file, data, cb ) {
        cb();
      });

      var stateFileName = '/tmp/NoCallbackFile';
      var stateToWrite = 'No Callback Test State';

      expect( basefnode.writeStateFile( stateFileName, 
                                stateToWrite,
                                outputPorts,
                                { name: 'TestState' },
                                null) ).to.not.throw.error; 

      fs.writeFile.restore();
    });
               
    it('should fail gracefully with an error if cannot write file', function(done) {

      var stateFileName = '/ACompletelyBogusPath/Bogus'+Math.random()+'/BadFileName';
      var stateToWrite = 'My Test State';
      basefnode.writeStateFile( stateFileName, 
                                stateToWrite,
                                outputPorts, 
                                { name: 'TestState' },
                                function(error, stateFile) { 

         error.should.not.equal(null);
         stateFile.should.equal(stateFileName);

         outputPorts.error.send.called.should.be.true;
         outputPorts.error.disconnect.called.should.be.true;

         outputPorts.out.send.called.should.be.false;
         outputPorts.out.disconnect.called.should.be.false;
         done();
      });
    });
  });

});
