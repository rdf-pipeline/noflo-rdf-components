/**
 * File: json-file-node-mocha.js
 * Unit tests for the json-file-node APIs defined in components/json-file-node.js
 */

var fs = require('fs');
var _ = require('underscore');

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var jsonFileNode = require('../components/json-file-node');

describe('json-file-node', function() {

  it('json-file-node should exist', function() {
    should.exist( jsonFileNode );
  });

  describe('#getComponent', function() {

    it('getComponent should instantiate and return a valid noflo component', function() {

      var jsonNode = jsonFileNode.getComponent(); 

      jsonNode.should.not.be.null;
      jsonNode.should.be.an('object');
       
      // Make sure we have the expected input ports for this component
      jsonNode.inPorts.should.exist;
      jsonNode.inPorts.ports.should.exist;
      jsonNode.inPorts.ports.should.be.an('object');
      expect(Object.keys(jsonNode.inPorts.ports).length).to.equal(2);
      expect(jsonNode.inPorts.ports.hasOwnProperty('options')).to.be.true;
      expect(jsonNode.inPorts.ports.hasOwnProperty('in')).to.be.true;

      // Verify the expected input ports are actually instantiated
      jsonNode.inPorts.options.should.exist;
      jsonNode.inPorts.options.should.be.an('object');
      jsonNode.inPorts.in.should.exist;
      jsonNode.inPorts.in.should.be.an('object');

      // Make sure we have the expected output ports for this component
      jsonNode.outPorts.should.exist;
      jsonNode.outPorts.ports.should.exist;
      jsonNode.outPorts.ports.should.be.an('object');
      expect(Object.keys(jsonNode.outPorts.ports).length).to.equal(2);
      expect(jsonNode.outPorts.ports.hasOwnProperty('out')).to.be.true;
      expect(jsonNode.outPorts.ports.hasOwnProperty('error')).to.be.true;

      // Verify the expected output ports are actually instantiated
      jsonNode.outPorts.out.should.exist;
      jsonNode.outPorts.out.should.be.an('object');
      jsonNode.outPorts.error.should.exist;
      jsonNode.outPorts.error.should.be.an('object');

      // Verify that we were able to extend the object to add extra attributes
      jsonNode.description.should.exist;
      jsonNode.description.should.be.a('string');
      jsonNode.icon.should.exist;
      jsonNode.icon.should.be.a('string');
      jsonNode.inAttrs.should.exist;
      jsonNode.inAttrs.should.be.an('object');
      jsonNode.outAttrs.should.exist;
      jsonNode.outAttrs.should.be.an('object');
    });

  });

  describe('#process', function() {

    it('Json-file-node component options port process function should call on and assign', function() {
 
      // Set up a couple sinon spies to be sure this component is handling its process 
      // events for the options and in ports correctly. 
      basenode = require('../components/base-node');
      var assignSpy = sinon.spy(basenode, 'assign');
      var onSpy = sinon.spy(basenode, 'on');

      var jsonNode = jsonFileNode.getComponent(); 
      jsonNode.should.exist;
      jsonNode.should.be.an('object');

      // Verify that the on and assign callbacks were setup 
      onSpy.called.should.be.true;
      assignSpy.calledOnce.should.be.true;

      // Verify data call looks correct
      assignSpy.calledWith('options').should.be.true;
      onSpy.calledWith(sinon.match.object).should.be.true;

      // Verify we got the callback function we'll use at runtime when we have input data
      assignSpy.returnValues[0].should.be.a('function');
      onSpy.returnValues[0].should.be.a('function'); // should be assign
      onSpy.returnValues[1].should.be.a('function'); // should be handle

      // Call the on data function and verify our this context will be updated with the data 
      var onCb =  onSpy.returnValues[0];
      var testData = { stateFile: '/tmp/stateFile' };
      var testContext = { nodeInstance: {} };
      onCb.call( testContext, 'data', testData);
      testContext.nodeInstance.options.should.exist;
      expect(testContext.nodeInstance.options).to.deep.equal(testData);

      // Cleanup the spies
      assignSpy.restore();
      onSpy.restore();
    });

  });

  describe('#handle', function() {

    beforeEach(function( done) {
      // Set up a sinon spy for on data
      basenode = require('../components/base-node');
      onSpy = sinon.spy(basenode, 'on');

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

      // Set up sinon stubs on the port APIs so we can verify they
      // got called when they should and didn't when they should not
      sinon.stub(outputPorts.out, 'disconnect');
      sinon.stub(outputPorts.out, 'send');
      sinon.stub(outputPorts.error, 'disconnect');
      sinon.stub(outputPorts.error, 'send');
      done();
    });

    afterEach(function(done) {
      // Cleanup the spy
      onSpy.restore();

      // Cleanup stubs
      outputPorts.out.disconnect.restore();
      outputPorts.out.send.restore();
      outputPorts.error.disconnect.restore();
      outputPorts.error.send.restore();
      delete outputPorts;
      done();
    });

    it('handle should execute with no errors when passed good parameters', function(done) {

      var jsonNode = jsonFileNode.getComponent(); 
      jsonNode.should.exist;
      jsonNode.should.be.an('object');

      onSpy.called.should.be.true;

      onSpy.returnValues[0].should.be.a('function'); // should be assign
      onSpy.returnValues[1].should.be.a('function'); // should be handle

      // Call the on data function and verify our this context will be updated with the data 
      var onCb =  onSpy.returnValues[1];
      var stateFilePath = './test/state/TestNode';
      var testContext = { nodeInstance: {
                            options: { name: 'TestNode',
                                       stateFile: stateFilePath,
                                       updater: './test/updaters/query-updater.js' },
                            outAttrs: { sourceName: 'name',
                                        jsObject: 'jsObject',
                                        updaterArgs: 'updaterArgs' },
                            outPorts: outputPorts
                          }
                        }
      var testData = { 
                   'sourceName': 'Init',
		   'file': './test/data/patient.json',
                   'updaterArgs': JSON.stringify( { 'id': '002' } )
                 };

      onCb.call( testContext, 'data', testData, function(stateFile, error) {

        // Nothing should have been sent on the error ports
        outputPorts.error.send.called.should.be.false;
        outputPorts.error.disconnect.called.should.be.false;

        // Should have sent payload to the next component 
        outputPorts.out.send.called.should.be.true;
        outputPorts.out.disconnect.called.should.be.true;

        // Did we get the expected state file for this node? 
        fs.stat(stateFilePath, function(error, stats) {
          fs.open(stateFilePath, 'r', function(error, fd) {
            var buf = new Buffer(stats.size);

            fs.read(fd, buf, 0, buf.length, null, function(error, bytesRead, buf) {
              var data = buf.toString('utf8', 0, buf.length).replace(/\r?\n|\r/,'');
              var expectedData = '[{"id":"002","name":"Jane Doe","dob":"1979-01-23"}]';
              expect(data).to.equal(expectedData);
              fs.close(fd);
              done();
            });
          });
        });
      });
    });

    it('handle should fail if called with no configuration options name', function(done) {

      var jsonNode = jsonFileNode.getComponent(); 
      var onCb =  onSpy.returnValues[1];  // get the handle function

      // Set up our test parameters - note that options has no name property
      var stateFilePath = './test/state/TestNode';
      var testContext = { nodeInstance: {
                            options: { updater: './test/updaters/query-updater.js' },
                            outAttrs: { sourceName: 'name',
                                        jsObject: 'jsObject',
                                        updaterArgs: 'updaterArgs' },
                            outPorts: outputPorts
                          }
                        }
      var testData = { 
                   'sourceName': 'Init',
		   'file': './test/data/patient.json',
                   'updaterArgs': JSON.stringify( { 'id': '002' } )
                 };

      // Call the function and verify we get the expected exception
      var testWrapper = function() {
        onCb.call( testContext, 'data', testData ); 
      };

      expect( testWrapper ).to.Throw( 'Missing required setting "name".' );
      done();
    });

    it('handle should callback with failed state file write status', function(done) {

      var jsonNode = jsonFileNode.getComponent(); 
      var onCb =  onSpy.returnValues[1];  // get the handle function

      // generate a non-existing file pathto force a write failure
      var stateFilePath = './test/state'+Math.random()+'/TestNode';
      var testContext = { nodeInstance: {
                            options: { name: 'TestNode',
                                       stateFile: stateFilePath,
                                       updater: './test/updaters/query-updater.js' },
                            outAttrs: { sourceName: 'name',
                                        jsObject: 'jsObject',
                                        updaterArgs: 'updaterArgs' },
                            outPorts: outputPorts
                          }
                        }
      var testData = { 
                   'sourceName': 'Init',
		   'file': './test/data/patient.json',
                   'updaterArgs': JSON.stringify( { 'id': '002' } )
                 };

      onCb.call( testContext, 'data', testData, function(stateFile, error) {
          error.should.not.be.null;

          outputPorts.error.send.called.should.be.true;
          outputPorts.error.disconnect.called.should.be.true;

          outputPorts.out.send.called.should.be.false;
          outputPorts.out.disconnect.called.should.be.false;

          done();
      });

    });
  });
});
