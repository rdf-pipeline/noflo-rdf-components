/**
 * File: javascript-wrapper.js
 * Unit tests for the APIs defined in components/javascript-wrapper.js
 */

var chai = require('chai');

var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var _ = require('underscore');
var noflo = require('noflo');

var jswrapper = require('../components/javascript-wrapper');
var commonTest = require('./common-test');

describe('javascript-wrapper', function() {

    it('should exist as an object', function() {
        jswrapper.should.exist;
        jswrapper.should.be.a('function');
    });

    it("should reject undefined definition", function() {
        return Promise.resolve().then(jswrapper).should.be.rejected;
    });

    it("should reject empty definition", function() {
        return Promise.resolve({}).then(jswrapper).should.be.rejected;
    });

    it("should reject empty inPorts", function() {
        return Promise.resolve({inPorts:{}}).then(jswrapper).should.be.rejected;
    });

    it("should accept array of inPort names", function() {
        return Promise.resolve({
            inPorts:['in']
        }).then(jswrapper).then(commonTest.createComponent).then(function(component){
            return _.keys(component.inPorts);
        }).should.eventually.contain('in');
    });

    it("should accept object with one inPort definition", function() {
        return Promise.resolve({
            inPorts: { 
                in: { datatype: 'string', 
                      description: "input description",
                      required: true }
            }
        }).then(jswrapper).then(commonTest.createComponent).then(function(component){
            return _.keys(component.inPorts);
        }).should.eventually.contain('in');
    });

    it("should trigger onchange function if no updater", function() {
        var handler;
        return Promise.resolve({
            inPorts:['hello'],
            onchange: function(state) {
                handler(state);
            }
        }).then(jswrapper).then(commonTest.createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            return new Promise(function(callback){
                handler = callback;
                commonTest.sendData(component, 'hello', "world");
            });
        }).should.become({'hello': "world"});
    });

    it("should generate input ports and run updater when passed only an updater", function() {
        var handler;
        var updater = function(x) { 
           handler('success');
        };
        return Promise.resolve(jswrapper(updater)).then(commonTest.createComponent).then(function(component){
            return new Promise(function(callback){
                handler = callback;
                commonTest.sendData(component, 'x', "test input");
            });
        }).should.become( 'success' );
    });

    it("should trigger updater function with no input parameters", function() {
        var handler;
        return Promise.resolve({
            inPorts:{
                in: {required: true},
            },
            updater: function() {
               handler('success');
            }
        }).then(jswrapper).then(commonTest.createComponent).then(function(component){
            return new Promise(function(callback){
                handler = callback;
                commonTest.sendData(component, 'in', "test input");
            });
        }).should.become( 'success' );
    });

    it("should trigger updater function with state as input parameter when cannot introspect", function() {

        var handler;
        // bind function to the current context and pass argument "testArg"; this function cannot be introspected 
        var updater = (function(context,arg1){ 
             arguments.should.have.length(2);
             arguments[0].should.deep.equal('testArg');
             arguments[1].should.deep.equal( { in:'test input' } );
             handler('success');
        }).bind(this,"testArg");

        return Promise.resolve({
            inPorts:{
                in: {required: true}
            },
            updater: updater 
        }).then(jswrapper).then(commonTest.createComponent).then(function(component){
            return new Promise(function(callback){
                handler = callback;
                commonTest.sendData(component, 'in', "test input");
            });
        }).should.become( 'success' );
    });

    it("should trigger updater function with input parameters", function() {
        var handler;
        return Promise.resolve({
            inPorts:{
                in1: { datatype: 'string', 
                      description: "input 1 description",
                      required: true },
                in2: { datatype: 'string', 
                      description: "input 2 description",
                      required: true }
            },
            updater: function( in1, in2 ) {
               handler(in1+in2);
            }
        }).then(jswrapper).then(commonTest.createComponent).then(function(component){
            return new Promise(function(callback){
                handler = callback;
                commonTest.sendData(component, 'in1', "alpha and ");
                commonTest.sendData(component, 'in2', "omega");
            });
        }).should.become( 'alpha and omega' );
    });

  // This introspect tests must be run in test mode with NODE_ENV=test 
  // e.g., NODE_ENV=test mocha since we are testing a private function
  describe('#introspect - run with NODE_ENV=test to fully execute these tests', function() {

    it("should have an introspect function", function() { 
        if ( process.env.NODE_ENV === 'test' ) { 
            jswrapper._private.introspect.should.exist;
            jswrapper._private.introspect.should.be.a('function');
        }
    });

    it("should introspect a function with no arguments", function() {
        if ( process.env.NODE_ENV === 'test' ) { 
            var testFunction = function() { 
                console.log("this is a no arg function");
            };
            var args = jswrapper._private.introspect(testFunction);
            args.should.have.length(0);
            args.should.be.an('array');
            args.should.deep.equal( [] ); 
       }
    });

    it("should introspect single argument function", function() {
        if ( process.env.NODE_ENV === 'test' ) { 
            var testFunction = function( oneArg ) { 
                console.log("this is a one arg function");
            };
            var args = jswrapper._private.introspect(testFunction);
            args.should.have.length(1);
            args.should.be.an('array');
            args.should.deep.equal( [ 'oneArg' ] ); 
       } 
    });

    it("should introspect two argument function", function() {
        if ( process.env.NODE_ENV === 'test' ) { 
            var testFunction = function( oneArg, twoArg ) { 
                console.log("this is a two arg function");
            };
            var args = jswrapper._private.introspect(testFunction);
            args.should.have.length(2);
            args.should.be.an('array');
            args.should.deep.equal( [ 'oneArg', 'twoArg' ] ); 
       } 
    });
  });

});
