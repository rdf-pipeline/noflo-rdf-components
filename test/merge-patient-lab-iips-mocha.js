// merge-patient-lab-iips-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var sinon = require('sinon');

var _ = require('underscore');
var noflo = require('noflo');

var componentFactory = require('../components/merge-patient-lab-iips');
var getComponent = require('../components/merge-patient-lab-iips').getComponent;
var State = require('../components/state');

var commonTest = require('./common-test');
var commonStubs = require('./common-stubs');

describe('merge-patient-lab-iips', function() {

    describe('#rpf', function() {
 
        it("should have an rpf object on nodeInstance", function() {
            return Promise.resolve(componentFactory.getComponent )
                .then(commonTest.createComponent).then(function(component){
                    component.rpf.should.exist;
                    component.rpf.should.be.an('object');
            });
        });

        it("should have a vni function", function() {
            return Promise.resolve(componentFactory.getComponent )
                .then(commonTest.createComponent).then(function(component){
                    component.rpf.vni.should.exist;
                    component.rpf.vni.should.be.a('function');
            });
        });

        describe('#vni', function() {

            it("should return a valid vni object", function() {
                return Promise.resolve(componentFactory.getComponent )
                  .then(commonTest.createComponent).then(function(component){

                    var vni = component.rpf.vni('');
                    vni.should.be.an('object');
                });
            });

            it("should have inputState function", function() {
                return Promise.resolve(componentFactory.getComponent )
                    .then(commonTest.createComponent).then(function(component){
                        component.rpf.vni('').inputState.should.exist;
                        component.rpf.vni('').inputState.should.be.a('function');
                });
            });

            it("should have outputState function", function() {
                return Promise.resolve(componentFactory.getComponent )
                    .then(commonTest.createComponent).then(function(component){
                        component.rpf.vni('').outputState.should.exist;
                        component.rpf.vni('').outputState.should.be.a('function');
                });
            });

            describe('#errorState', function() {

                it("should initially return nothing", function() {
                    return Promise.resolve(componentFactory.getComponent )
                        .then(commonTest.createComponent).then(function(component){
                            return component.rpf.vni('').errorState();
                    }).should.become(undefined);
                });

                it("should set error state", function() {
                    return Promise.resolve(componentFactory.getComponent )
                        .then(commonTest.createComponent).then(function(component){
                             component.rpf.vni('').errorState('Setting an error message');
                             var errState =  component.rpf.vni('').errorState();
                             errState.data.should.equal('Setting an error message');
                    })
                });
            });

            describe('#inputState', function() {

                it("should initially return nothing", function() {
                    return Promise.resolve(componentFactory.getComponent )
                        .then(commonTest.createComponent).then(function(component){
                            return component.rpf.vni('').inputState('patient');
                    }).should.become(undefined);
                });

                it("should have input state after input", function() {
                    return Promise.resolve(componentFactory.getComponent )
                        .then(commonTest.createComponent).then(function(component){

                            // initialize state
                            component.rpf.vni('').inputState( 'patient',
                                                              State( { id: '001', 
                                                                       name: 'Alice',
                                                                       dob: '1979-01-23' }) );

                            var currentState = component.rpf.vni('').inputState('patient');
                            currentState.should.be.an('object');
                            currentState.should.have.all.keys( 'data', 'lm' );
                    });
                });

                it("should have input state data after input", function() {
                    return Promise.resolve(componentFactory.getComponent )
                        .then(commonTest.createComponent).then(function(component){

                            // initialize state
                            var patientState = State( { id: '001', name: 'Alice', dob: '1979-01-23' } );
                            component.rpf.vni('').inputState( 'patient',
                                                              patientState );

                            var currentState = component.rpf.vni('').inputState('patient');
                            currentState.should.be.an('object');
			    currentState.data.should.equal( patientState.data );
			    currentState.lm.should.equal( patientState.lm );
                    });
                });
            });

            describe('#outputState', function() {

                it("should initially return nothing", function() {
                    return Promise.resolve(componentFactory.getComponent )
                        .then(commonTest.createComponent).then(function(component){
                            return component.rpf.vni('').outputState();
                    }).should.become(undefined);
                });

                it("should have a output state after input", function() {
                    return Promise.resolve(componentFactory.getComponent )
                        .then(commonTest.createComponent).then(function(component){

                            // initialize state
                            component.rpf.vni('').outputState( { id: '001', 
                                                                 name: 'Alice', 
                                                                 dob: '1979-01-23', 
                                                                 glucose: '75',  
                                                                 date: '2012-02-01'});

                            var currentState = component.rpf.vni('').outputState();
                            currentState.should.be.an('object');
                            currentState.should.have.all.keys( 'data', 'lm' );
                        });
                });

                it("should have an output state data after input", function() {
                    return Promise.resolve(componentFactory.getComponent )
                        .then(commonTest.createComponent).then(function(component){

                            // initialize state
                            var outputState = { id: '001', name: 'Alice', dob: '1979-01-23', 
                                                glucose: '75',  date: '2012-02-01'};
                            component.rpf.vni('').outputState( outputState ); 

                            var currentState = component.rpf.vni('').outputState();
                            currentState.should.be.an('object');
                            currentState.data.should.deep.equal( outputState );
                        });
                });
            });
        });
    });

    describe('functional behavior', function() {

    
        it("should have patient input state after input", function() {
            return Promise.resolve(componentFactory.getComponent )
                .then(commonTest.createComponent).then(function(component){

                    stubState( component );  // REMOVE WHEN STATES DONE
                    commonTest.sendData( component, 'patient',
                                         {id: '001',  name: 'Alice', dob: '1979-01-23' });

                    return component;

                }).then(commonStubs.promiseLater).then(function(component){
                    return component.rpf.vni('').inputState('patient');

                }).then(_.keys).then(_.sortBy).should.become(_.sortBy(['data', 'lm']));
        });

        it("should have patient input state data after input", function() {
            return Promise.resolve(componentFactory.getComponent )
                .then(commonTest.createComponent).then(function(component){

                    stubState( component );  // REMOVE WHEN STATES DONE
                    commonTest.sendData( component, 'patient',
                                         {id: '001',  name: 'Alice', dob: '1979-01-23' });
                    return component;

                }).then(commonStubs.promiseLater).then(function(component){
                    return component.rpf.vni('').inputState('patient');

                }).then(_.property('data')).should.become({id: '001',  name: 'Alice', dob: '1979-01-23' });
        });

        it("should have labwork input state after input", function() {
            return Promise.resolve(componentFactory.getComponent )
                .then(commonTest.createComponent).then(function(component){

                    stubState( component );  // REMOVE WHEN STATES DONE
                    commonTest.sendData( component, 'labwork',
                                         {id: '001',  glucose: '75',  date: '2012-02-01'});
                    return component;

                }).then(commonStubs.promiseLater).then(function(component){

                    return component.rpf.vni('').inputState('labwork');

                }).then(_.keys).then(_.sortBy).should.become(_.sortBy(['data', 'lm']));
        });

        it("should have labwork input state data after input", function() {
            return Promise.resolve(componentFactory.getComponent )
                .then(commonTest.createComponent).then(function(component){

                    stubState( component );  // REMOVE WHEN STATES DONE
                    commonTest.sendData( component, 'labwork',
                                         {id: '001',  glucose: '75',  date: '2012-02-01'});
                    return component;

                }).then(commonStubs.promiseLater).then(function(component){
                    return component.rpf.vni('').inputState('labwork');

                }).then(_.property('data')).should.become({id: '001',  glucose: '75',  date: '2012-02-01'});
        });

        it.skip( "should have patient and labwork output state after input ports processing", function(done) {
            return Promise.resolve(componentFactory.getComponent )
                .then(commonTest.createComponent).then(function(component){

                    sinon.stub(component.outPorts.output, 'send', function( data ) {
                        data.should.exist;
                        data.should.not.be.empty;
                        data.should.have.ownProperty('output');
                        data.output.should.be.an('object');
                        data.output.should.have.all.keys( 'id', 'name', 'dob', 'glucose', 'date' );
                        data.output.id.should.equal('001');
                        data.output.name.should.equal('Alice');
                        data.output.dob.should.equal('1979-01-23');
                        data.output.glucose.should.equal('75');
                        data.output.date.should.equal('2012-02-01'); 
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

// TODO: REMOVE THIS WHEN STATES ARE INTEGRATED
function stubState( component ) { 
    // Set the states we'll need to execute these tests as a stub.
    // This code should be removed when we have a real implementation
    component.rpf.vni('').inputState( 'patient',
                                      State( { id: '001', name: 'Alice', dob: '1979-01-23' } ));
    component.rpf.vni('').inputState( 'labwork',
                                      State( {id: '001',  glucose: '75',  date: '2012-02-01'} ));
} 
