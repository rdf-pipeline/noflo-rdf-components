// merge-patient-lab-iips-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var _ = require('underscore');
var noflo = require('noflo');

var componentFactory = require('../components/merge-patient-lab-iips');
var getComponent = componentFactory.getComponent;

var test = require('./common-test');
var commonStubs = require('./common-stubs');

describe('merge-patient-lab-iips', function() {

    it("should be an object", function() {
        var component = test.createComponent(componentFactory.getComponent);
        component.should.exist;
        component.should.be.an('object');
    });

    it("should have inputState function", function() {
        var component = test.createComponent(componentFactory.getComponent);
        component.inputState.should.exist;
        component.inputState.should.be.a('function');
    });

    it("should have outputState function", function() {
        var component = test.createComponent(componentFactory.getComponent);
        component.outputState.should.exist;
        component.outputState.should.be.a('function');
    });

    describe('#errorState', function() {

        it("should initially return nothing", function() {
            var component = test.createComponent(componentFactory.getComponent);
            component.errorState().should.become(undefined);
        });

        it("should set error state", function() {
            var component = test.createComponent(getComponent);
            var errorState = {
                data: Error( 'Setting an error message' ),
                lm: 'LM1328113669.00000000000000001'
            };
            component.errorState(_.clone(errorState)).then(function(){
                return component.errorState();
            }).should.eventually.equal(errorState);
        });
    });

    describe('#inputState', function() {

        it("should initially return nothing", function() {
            var component = test.createComponent(getComponent);
            component.inputState('patient').should.become(undefined);
        });

        it("should have input state after input", function() {
            var component = test.createComponent(getComponent);
            // initialize state
            component.inputState( 'patient', {
                data: {
                    id: '001',
                    name: 'Alice',
                    dob: '1979-01-23'
                },
                lm: 'LM1328113669.00000000000000001'
            }).then(function(){
                return component.inputState('patient');
            }).should.eventually.have.all.keys( 'data', 'lm' );
        });

        it("should have input state data after input", function() {
            var component = test.createComponent(getComponent);
            // initialize state
            var patientState = {
                data: { id: '001', name: 'Alice', dob: '1979-01-23' },
                lm: 'LM1328113669.00000000000000001'
            };
            component.inputState( 'patient', _.mapObject(patientState, _.clone) ).then(function(){
                return component.inputState('patient');
            }).then(function(currentState){
                currentState.should.be.an('object');
                currentState.data.should.equal( patientState.data );
                currentState.lm.should.equal( patientState.lm );
            });
        });
    });

    describe('#outputState', function() {

        it("should initially return nothing", function() {
            var component = test.createComponent(getComponent);
            component.outputState().should.become(undefined);
        });

        it("should have a output state after input", function() {
            var component = test.createComponent(getComponent);
            // initialize state
            component.outputState({
                data: { id: '001',
                         name: 'Alice',
                         dob: '1979-01-23',
                         glucose: '75',
                         date: '2012-02-01'
                 },
                lm: 'LM1328113669.00000000000000001'
            }).then(function(){
                return component.outputState();
            }).then(function(currentState){
                currentState.should.be.an('object');
                currentState.should.have.all.keys( 'data', 'lm' );
            });
        });

        it("should have an output state data after input", function() {
            var component = test.createComponent(getComponent);
            // initialize state
            var outputState = {
                data: {
                    id: '001',
                    name: 'Alice',
                    dob: '1979-01-23',
                    glucose: '75',
                    date: '2012-02-01'
                },
                lm: 'LM1328113669.00000000000000001'
            };
            component.outputState( _.mapObject(outputState, _.clone) ).then(function(){
                return component.outputState();
            }).then(function(currentState){
                currentState.should.be.an('object');
                currentState.data.should.deep.equal( outputState.data );
                currentState.lm.should.be.a('string');
            });
        });
    });

    describe('#behavior', function() {

        it("should have patient input state after input", function() {
            var component = test.createComponent(getComponent);
            test.sendData( component, 'patient',
                                     {id: '001',  name: 'Alice', dob: '1979-01-23' });
            return commonStubs.promiseLater().then(function(){
                return component.inputState('patient');
            }).then(_.keys).then(_.sortBy).should.become(_.sortBy(['data', 'lm']));
        });

        it("should have patient input state data after input", function() {
            var component = test.createComponent(getComponent);
            test.sendData( component, 'patient',
                                         {id: '001',  name: 'Alice', dob: '1979-01-23' });
            return commonStubs.promiseLater().then(function(){
                return component.inputState('patient');
            }).then(_.property('data')).should.become({id: '001',  name: 'Alice', dob: '1979-01-23' });
        });

        it("should have labwork input state after input", function() {
            var component = test.createComponent(getComponent);
            test.sendData( component, 'labwork',
                                         {id: '001',  glucose: '75',  date: '2012-02-01'});
            return commonStubs.promiseLater().then(function(){
                return component.inputState('labwork');
            }).then(_.keys).then(_.sortBy).should.become(_.sortBy(['data', 'lm']));
        });

        it("should have labwork input state data after input", function() {
            var component = test.createComponent(getComponent);
            test.sendData( component, 'labwork',
                                         {id: '001',  glucose: '75',  date: '2012-02-01'});
            return commonStubs.promiseLater().then(function(){
                return component.inputState('labwork');
            }).then(_.property('data')).should.become({id: '001',  glucose: '75',  date: '2012-02-01'});
        });

        it( "should have patient and labwork output state after input ports processing", function() {
            var component = test.createComponent(getComponent);
            return new Promise(function(done, fail){
                var output = noflo.internalSocket.createSocket();
                component.outPorts.output.attach(output);
                output.on('data', function( payload ) {
                    payload.should.exist;
                    payload.should.not.be.empty;
                    payload.should.have.ownProperty('vnid');
                    payload.vnid.should.equal('');
                    payload.should.have.ownProperty('state');
                    payload.state.should.be.an('object');
                    payload.state.should.have.ownProperty('data');
                    payload.state.data.should.be.an('object');
                    payload.state.data.should.have.all.keys( 'id', 'name', 'dob', 'glucose', 'date' );
                    payload.state.data.id.should.equal('001');
                    payload.state.data.name.should.equal('Alice');
                    payload.state.data.dob.should.equal('1979-01-23');
                    payload.state.data.glucose.should.equal('75');
                    payload.state.data.date.should.equal('2012-02-01');
                    done();
                });
                var error = noflo.internalSocket.createSocket();
                component.outPorts.error.attach(error);
                error.on('data', fail);
                test.sendData( component, 'patient',
                                     {id: '001',  name: 'Alice', dob: '1979-01-23' });
                test.sendData( component,'labwork',
                                     {id: '001',  glucose: '75',  date: '2012-02-01'});
             });
        });
    });
});
