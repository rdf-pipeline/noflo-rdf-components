// merge-patient-lab-iips-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var _ = require('underscore');

var noflo = require('noflo');
var sinon = require('sinon');

var componentFactory = require('../components/merge-patient-lab-iips');
var commonTest = require('./common-test');
var state = require('../components/input-state');

describe('merge-patient-lab-iips', function() {

    it("should have an rpf object on nodeInstance", function() {
        return Promise.resolve(componentFactory.getComponent )
          .then(commonTest.createComponent).then(function(component){
            component.rpf.should.exist;
            component.rpf.should.be.an('object');
        });
    });

    describe('#rpf.createVni', function() {
        it("should have a rpf.createVni function", function() {
            return Promise.resolve(componentFactory.getComponent )
              .then(commonTest.createComponent).then(function(component){
                component.rpf.createVni.should.exist;
                component.rpf.createVni.should.be.a('function');
            });
        });

        it("should return a valid vni object", function() {
            return Promise.resolve(componentFactory.getComponent )
              .then(commonTest.createComponent).then(function(component){

                var vni = component.rpf.createVni( '' ); 
                vni.should.be.an('object');

                vni.should.have.ownProperty('vnid');
                vni.vnid.should.equal( '*' );

                vni.should.have.ownProperty('lm');
                vni.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);

                vni.should.have.ownProperty('inputState');
                vni.inputState.should.be.a('function');
            });
        });
    });

    describe('#rpf.vni', function() {
        it("should have a rpf.vni function", function() {
            return Promise.resolve(componentFactory.getComponent )
              .then(commonTest.createComponent).then(function(component){
                component.rpf.vni.should.exist;
                component.rpf.vni.should.be.a('function');
            });
        });

        it("should return a valid vni object", function() {
            return Promise.resolve(componentFactory.getComponent )
              .then(commonTest.createComponent).then(function(component){

                var createdVni = component.rpf.createVni(); 
                var vni = component.rpf.vni('');

                vni.should.be.an('object');
                vni.should.deep.equal( createdVni );

                vni.should.have.ownProperty('vnid');
                vni.vnid.should.equal( '*' );

                vni.should.have.ownProperty('lm');
                vni.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);

                vni.should.have.ownProperty('inputState');
                vni.inputState.should.be.a('function');
            });
        });
    });
 
    describe('#vni', function() {

        describe('#inputState', function() {

            it("should initially return nothing", function() {
                return Promise.resolve(componentFactory.getComponent )
                    .then(commonTest.createComponent).then(function(component){
                        return component.rpf.vni('').inputState('patient', '', '');
                    }).should.become(undefined);
            });

            it("should set and return an inputState payload", function() {

                return Promise.resolve(componentFactory.getComponent )
                    .then(commonTest.createComponent).then(function(component){

                    var vni = component.rpf.createVni('');

                    var payload = {id: '001',  name: 'Alice', dob: '1979-01-23'};
                    var initialState = vni.inputState('patient','testNode', state.IIP_PORT, payload);
                    initialState.should.be.an('object');
                    initialState.should.deep.equal( payload );

                    var retrievedState = vni.inputState('patient','testNode');
                    retrievedState.should.be.an('object');
                    retrievedState.should.deep.equal( payload );
                });
            });

            it("should have patient input state after input", function(done) {
                return Promise.resolve(componentFactory.getComponent )
                    .then(commonTest.createComponent).then(function(component){

                      sinon.stub(component.outPorts.output, 'send', function( data ) { 
                          data.should.exist;
                          /* data.should.not.be.empty;
                          data.should.have.ownProperty('out');
                          data.out.should.be.an('object');
                          data.out.should.have.all.keys( 'id', 'name', 'dob', 'glucose', 'date' );
                          data.out.id.should.equal('001');
                          data.out.name.should.equal('Alice');
                          data.out.dob.should.equal('1979-01-23');
                          data.out.glucose.should.equal('75');
                          data.out.date.should.equal('2012-02-01'); */
                          component.outPorts.output.send.restore();
                          done();
                      });

                    return new Promise( function(callback) { 
                        commonTest.sendData( component, 'patient', 
                                             {id: '001',  name: 'Alice', dob: '1979-01-23' });
                        commonTest.sendData( component,'labwork',
                                            {id: '001',  glucose: '75',  date: '2012-02-01'});
                    });
                });
            });

        });

    });
});

