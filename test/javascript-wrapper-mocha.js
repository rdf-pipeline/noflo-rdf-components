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

    it("should use default port & default updater if no node definition", function() {
        return Promise.resolve()
        .then(jswrapper).then(commonTest.createComponent).then(function(component){
            return _.keys(component.inPorts);
        }).should.eventually.contain('input');
    });

    it("should use default port & default updater if empty node definition", function() {
        return Promise.resolve({})
        .then(jswrapper).then(commonTest.createComponent).then(function(component){
            return _.keys(component.inPorts);
        }).should.eventually.contain('input');
    });

    it("should use default port & default updater if empty inPorts", function() {
        return Promise.resolve({inPorts:{}})
        .then(jswrapper).then(commonTest.createComponent).then(function(component){
            return _.keys(component.inPorts);
        }).should.eventually.contain('input');
    });

    it("should accept array of inPort names", function() {
        return Promise.resolve({
            inPorts:['testport']
        }).then(jswrapper).then(commonTest.createComponent).then(function(component){
            return _.keys(component.inPorts);
        }).should.eventually.contain('testport');
    });

    it("should accept object with one inPort definition", function() {
        return Promise.resolve({
            inPorts: { 
                input: { datatype: 'string', 
                         description: "input description",
                         required: true }
            }
        }).then(jswrapper).then(commonTest.createComponent).then(function(component){
            return _.keys(component.inPorts);
        }).should.eventually.contain('input');
    });

    it("should trigger default updater function if no updater", function(done) {
        var handler;
        return Promise.resolve({
            inPorts:['hello']
        }).then(jswrapper).then(commonTest.createComponent).then(function(component){
            // set up a stub on the output port send to see that it got called with data
            // sent to the input port, as the stub updater should be doing 
            sinon.stub(component.outPorts.out, 'send', function( data ) {
                data.should.exist;
                data.should.be.an('object');
                data.should.have.key('out');
                data.out.should.have.length(2);
                data.out.should.have.all.keys('0','1');
                data.out['0'].should.deep.equal({ hello: 'world' });
                component.outPorts.out.send.restore();
                done();
            });
            commonTest.sendData(component, 'hello', "world");
        });
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
                input: {required: true},
            },
            updater: function() {
               handler('success');
            }
        }).then(jswrapper).then(commonTest.createComponent).then(function(component){
            return new Promise(function(callback){
                handler = callback;
                commonTest.sendData(component, 'input', "test input");
            });
        }).should.become( 'success' );
    });

    it("should trigger updater function with state as input parameter when cannot introspect", function() {

        var handler;
        // bind function to the current context and pass argument "testArg"; this function cannot be introspected 
        var updater = (function(context,arg1){ 
             // verify we get 3 args - first will be the testArg on the binding; second will be the
             // port input; third will be the output payload from onchange which is undefined here
             arguments.should.have.length(3);
             arguments[0].should.deep.equal('testArg');
             arguments[1].should.deep.equal( { input:'test input' } );
             should.equal(arguments[2], undefined);
             handler('success');
        }).bind(this,"testArg");

        return Promise.resolve({
            inPorts:{
                input: {required: true}
            },
            updater: updater 
        }).then(jswrapper).then(commonTest.createComponent).then(function(component){
            return new Promise(function(callback){
                handler = callback;
                commonTest.sendData(component, 'input', "test input");
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

    it("should call updater with this.nodeInstance context", function() {
        var handler;
        var context;
        var updater = function(x) { 
           context.should.equal(this); 
           handler('success');
        };
        return Promise.resolve(jswrapper(updater)).then(commonTest.createComponent).then(function(component){
            return new Promise(function(callback){
                handler = callback;
                context = this;
                commonTest.sendData(component, 'x', "test input");
            });
        }).should.become( 'success' );
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
