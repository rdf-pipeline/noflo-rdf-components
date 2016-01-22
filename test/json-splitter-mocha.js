/**
 * File: jsonSplitter.js
 * Unit tests for the APIs defined in components/jsonSplitter.js
 */

var chai = require('chai');

var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var _ = require('underscore');
var noflo = require('noflo');

var jsonSplitter = require('../components/json-splitter');
var commonTest = require('./common-test');

describe('json-splitter', function() {

  it('should exist as an object', function() {
    jsonSplitter.should.exist;
    jsonSplitter.should.be.an('object');
  });

  describe('#getComponent', function() {

    it('should have getComponent API', function() {
        jsonSplitter.getComponent.should.exist;
        jsonSplitter.getComponent.should.be.a('function');
    });

    it('should get a component', function() {
        var component = jsonSplitter.getComponent.call();
        component.should.exist;
        component.should.be.an('Object');

        component.should.have.property('description');
        component.description.should.be.a('string');
  
        component.should.have.property('error');
        component.error.should.be.a('Function');

        component.should.have.property('inPorts');
        component.inPorts.should.be.an('object');
        component.inPorts.should.have.property('ports');
        Object.keys( component.inPorts.ports).should.have.length(2);

        component.inPorts.ports.should.have.property('in');
        component.inPorts.should.have.property('in');
        component.inPorts.in.should.have.property('options');
        component.inPorts.in.options.should.have.property('description');
        component.inPorts.in.options.should.have.property('ondata');
        component.inPorts.in.options.ondata.should.be.a('function');

        component.inPorts.ports.should.have.property('json_pointer');
        component.inPorts.should.have.property('json_pointer');
        component.inPorts.json_pointer.options.should.have.property('description');
        component.inPorts.json_pointer.options.should.have.property('ondata');
        component.inPorts.json_pointer.options.ondata.should.be.a('function');

        component.should.have.property('outPorts');
        component.outPorts.should.be.an('object');
        component.outPorts.should.have.property('ports');
        component.outPorts.ports.should.have.property('out');
        component.outPorts.ports.should.have.property('error');
        component.outPorts.should.have.property('out');
        component.outPorts.out.should.be.an('object');
        component.outPorts.should.have.property('error');
        component.outPorts.error.should.be.an('object');
        Object.keys( component.outPorts.ports).should.have.length(2);
    });

  });

  describe('#onchange', function() {

    it('should generate a record for each element of json input data array with a vnid', function( done ) {

        var testString = 
             `[
               { "id": "002", "name": "Jane Doe", "dob": "1979-01-23" },
               { "id": "003", "name": "John Doe", "dob": "1979-02-20" }
              ]`;
        var testData = JSON.parse( testString );

        return Promise.resolve(jsonSplitter.getComponent ) 
          .then(commonTest.createComponent).then(function(component){
             component.should.exist;
             component.should.be.an('Object');

             var callCount = 0;
             sinon.stub(component.outPorts.out, 'send', function( data ) { 

                data.vnid.should.exist;
                data.vnid.should.not.be.empty; 
                data.id.should.not.be.empty;
                data.vnid.should.equal(data.id);

                data.name.should.not.be.empty;
                data.dob.should.not.be.empty;

                if ( ++callCount === testData.length ) { 
                  component.outPorts.out.send.restore();
                  done();
                }
             });
             commonTest.sendData( component, 'json_pointer', '/id' );
             commonTest.sendData( component, 'in', testString );
          });
    });

    it('should handle a single json record', function( done ) {

        var testString = `{ "id": "002", "name": "Jane Doe", "dob": "1979-01-23" }`;
        var testData = JSON.parse( testString );

        return Promise.resolve(jsonSplitter.getComponent ) 
          .then(commonTest.createComponent).then(function(component){
             component.should.exist;
             component.should.be.an('Object');

             sinon.stub(component.outPorts.out, 'send', function( data ) { 

                data.vnid.should.exist;
                data.vnid.should.not.be.empty; 
                data.id.should.not.be.empty;
                data.vnid.should.equal(data.id);

                data.name.should.not.be.empty;
                data.dob.should.not.be.empty;

                component.outPorts.out.send.restore();
                done();
             });

             commonTest.sendData( component, 'json_pointer', '/id' );
             commonTest.sendData( component, 'in', testString );
          });
    });

    it('should throw an error on bad jsonpointer to object', function( done ) {

        return Promise.resolve(jsonSplitter.getComponent ) 
          .then(commonTest.createComponent).then(function(component){

             var testString = `{ "id": "002", "name": "Jane Doe", "dob": "1979-01-23" }`;

             // set up a spy on the output port to be sure it does not get called
             var outPortSpy = sinon.spy(component.outPorts.out, 'send');

             // Set up a stub to verify error port got called with bad json parse error
             sinon.stub(component.outPorts.error, 'send', function( data ) { 

                // verify that output port did not fire anything
                outPortSpy.called.should.be.false;

                // cleanup 
                outPortSpy.restore();
                component.outPorts.error.send.restore();

                done();
             });

             commonTest.sendData( component, 'json_pointer', '/key' );
             commonTest.sendData( component, 'in', testString );
              
          });
    });

    it('should throw an error on bad jsonpointer to array element', function( done ) {

        return Promise.resolve(jsonSplitter.getComponent ) 
          .then(commonTest.createComponent).then(function(component){

             var testString = 
               `[
                  { "id": "002", "name": "Jane Doe", "dob": "1979-01-23" },
                  { "id": "003", "name": "John Doe", "dob": "1979-02-20" }
                ]`;

             // Set up a stub to verify error port got called with bad json pointer error
             sinon.stub(component.outPorts.error, 'send', function( data ) { 
                component.outPorts.error.send.restore();
                done();
             });

             commonTest.sendData( component, 'json_pointer', '/key' );
             commonTest.sendData( component, 'in', testString );
              
          });
    });

    it('should throw an error on bad json object', function( done ) {

        return Promise.resolve(jsonSplitter.getComponent ) 
          .then(commonTest.createComponent).then(function(component){

             var badTestString = '{ "id": "002", "name": "Jane Doe", "dob": "1979-01-23" } ]';

             // set up a spy on the output port to be sure it does not get called
             var outPortSpy = sinon.spy(component.outPorts.out, 'send');

             // Set up a stub to verify error port got called with bad json parse error
             sinon.stub(component.outPorts.error, 'send', function( data ) { 

                // verify that output port did not fire anything
                outPortSpy.called.should.be.false;

                // cleanup 
                outPortSpy.restore();
                component.outPorts.error.send.restore();

                done();
             });

             commonTest.sendData( component, 'json_pointer', '/id' );
             commonTest.sendData( component, 'in', badTestString );
              
          });
    });

  });

});
