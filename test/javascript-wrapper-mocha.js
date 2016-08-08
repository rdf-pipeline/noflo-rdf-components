/**
 * File: javascript-wrapper.js
 * Unit tests for the APIs defined in src/javascript-wrapper.js
 */

var chai = require('chai');
var expect = chai.expect;

var jswrapper = require('../src/javascript-wrapper');

var commonWrapper = require('./common-wrapper');
var commonTest = require('./common-test');

var DEFAULT_NUMBER_OF_PORTS = 1;

describe('javascript-wrapper', function() {
   commonWrapper(jswrapper, DEFAULT_NUMBER_OF_PORTS);

   describe('javascript-wrapper specific tests', function() {

        describe('#fRunUpdater', function() {

            it("should generate input ports and run updater when passed only an updater", function() {

                var handler;
                var updater = function(testport) {
                   handler('success');
                };
                var node = commonTest.createComponent(jswrapper(updater));

                return new Promise(function(callback){
                    handler = callback;
                    commonTest.sendData(node, 'testport', "test input");
                }).should.become('success');
            });

            it("should trigger javascript wrapper updater function if no updater specified", function() {

                var inputData = "bonjour!";
                var node = commonTest.createComponent(jswrapper({ inPorts:['input'] }));

                return new Promise(function(done, fail) {
                    commonTest.onOutPortData(node, 'output', done);
                    commonTest.onOutPortData(node, 'error', fail);

                    commonTest.sendData(node, 'input', inputData);

                }).then(function(done) {
                    done.should.be.an('object');
                    done.vnid.should.equal('');
                    done.data.should.equal(inputData);
                    done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                }, function(fail) {
                    assert.isNotOk(fail);
                });
            });

            it("should trigger updater function with no input parameters", function() {

                var handler;
                var node =
                    commonTest.createComponent(
                        jswrapper({
                                     inPorts:{
                                         input: {required: true},
                                     },
                                     updater: function() {
                                         handler('success');
                                     }
                                  })
                    );

                return new Promise(function(callback){
                    handler = callback;
                    commonTest.sendData(node, 'input', "test input");
                }).should.become('success');
            });

            it("should trigger updater function even when cannot introspect it", function() {

                var handler;
                var testArg = "testArg";

                // bind function to the current context and pass argument "testArg";
                // this function cannot be introspected
                var updater = (function(arg1){
                     arg1.should.equal(testArg);
                     handler('success');
                }).bind(this, testArg);

                var node =
                    commonTest.createComponent(
                        jswrapper({
                                    inPorts:{
                                        input: {required: true}
                                    },
                                    updater: updater
                        })
                    );

                return new Promise(function(callback){
                    handler = callback;
                    commonTest.sendData(node, 'input', "test input");
                }).should.become('success');
            });

            it("should call updater with VNI context", function() {
                var handler;
                var updater = function(input) {
                   this.should.have.all.keys('vnid', 'delete', 'inputStates',
                                              'errorState', 'outputState', 'nodeInstance');
                   handler('success');
                };
                var node =
                    commonTest.createComponent(jswrapper(updater));
    
                return new Promise(function(callback){
                    handler = callback;
                    commonTest.sendData(node, 'input', "test input");
                }).should.become('success');
            });

            it("should trigger updater function with multiple input parameters", function() {
                this.timeout(3000);
                var handler;
                return commonTest.createNetwork(
                    { node1: 'core/Repeat', // input node to test node 3
                      node2: 'core/Repeat', // input node to test node 3
                      node3:  { 
                          getComponent:
                              jswrapper({
                                          inPorts:{
                                               in1: { datatype: 'string', 
                                                      required: true },
                                               in2: { datatype: 'string', 
                                                      required: true }
                                          },
                                          updater: function(in1, in2) {
                                              return in1+in2;
                                          }
                              })
                      }
                }).then(function(network) { 

                    return new Promise(function(done, fail) {

                        var node = network.processes.node3.component;

                        commonTest.onOutPortData(node, 'output', done);
                        commonTest.onOutPortData(node, 'error', fail);

                        network.graph.addEdge('node1', 'out', 'node3', 'in1');
                        network.graph.addEdge('node2', 'out', 'node3', 'in2');

                        network.graph.addInitial("alpha and ", 'node1', 'in');
                        network.graph.addInitial("omega", 'node2', 'in');

                    }).then(function(done) {

                       // verify we got the output state we expect
                       done.vnid.should.equal('');
                       done.data.should.equal("alpha and omega");
                       expect(done.error).to.be.undefined;
                       done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);
                    });
               });
           });

           // This introspect tests must be run in test mode with NODE_ENV=test
           // e.g., NODE_ENV=test mocha since we are testing a private function
           describe('#introspect - run with NODE_ENV=test to fully execute these tests', function() {

               it("should have an introspect function", function() {
                   if (process.env.NODE_ENV === 'test') {
                       jswrapper._private.introspect.should.exist;
                       jswrapper._private.introspect.should.be.a('function');
                   }
               });

               it("should introspect a function with no arguments", function() {
                   if (process.env.NODE_ENV === 'test') {
                       var testFunction = function() {
                           console.log("this is a no arg function");
                       };
                       var args = jswrapper._private.introspect(testFunction);
                       args.should.have.length(0);
                       args.should.be.an('array');
                       args.should.deep.equal([]);
                  }
               });

               it("should introspect single argument function", function() {
                   if (process.env.NODE_ENV === 'test') {
                       var testFunction = function(oneArg) {
                           console.log("this is a one arg function");
                       };
                       var args = jswrapper._private.introspect(testFunction);
                       args.should.have.length(1);
                       args.should.be.an('array');
                       args.should.deep.equal([ 'oneArg' ]);
                   }
               });

               it("should introspect two argument function", function() {
                   if (process.env.NODE_ENV === 'test') {
                       var testFunction = function(oneArg, twoArg) {
                           console.log("this is a two arg function");
                       };
                       var args = jswrapper._private.introspect(testFunction);
                       args.should.have.length(2);
                       args.should.be.an('array');
                       args.should.deep.equal([ 'oneArg', 'twoArg' ]);
                  }
               });
           });
       });
    });
});

