// merge-patient-lab-iips-mocha.js

var chai = require('chai');
var expect = chai.expect;
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var _ = require('underscore');
var noflo = require('noflo');

var compFactory = require('../components/merge-patient-lab-iips');

var test = require('./common-test');
var stubs = require('./common-stubs');

describe('merge-patient-lab-iips', function() {
 
    it("should be an object on nodeInstance", function() {
        var node = test.createComponent(compFactory);
        expect(node).to.be.an('object');
    });

    it("should have a vni function", function() {
        var node = test.createComponent(compFactory);
        expect(node.vni).to.be.a('function');
    });

    describe('#vni', function() {

        it("should return a valid vni object", function() {
            var node = test.createComponent(compFactory);
            var vni = node.vni();
            expect(vni).to.be.an('object');
        });

        it("should have inputStates function", function() {
            var node = test.createComponent(compFactory);
            expect(node.vni().inputStates).to.be.a('function');
        });

        it("should have outputState function", function() {
            var node = test.createComponent(compFactory);
            node.vni().outputState.should.exist;
            node.vni().outputState.should.be.a('function');
        });

        describe('#errorState', function() {

            it("should initially return nothing", function() {
                var node = test.createComponent(compFactory);
                expect(node.vni().errorState()).to.be.undefined;
            });

            it("should set error state", function() {
                var node = test.createComponent(compFactory);
                var errorState = {
                    data: Error( 'Setting an error message' ),
                    lm: 'LM1328113669.00000000000000001'
                };
                node.vni().errorState(_.clone(errorState));
                node.vni().errorState().should.eql(errorState);
            });
        });

        describe('#inputStates', function() {

            it("should initially return nothing", function() {
                var node = test.createComponent(compFactory);
                expect(node.vni().inputStates('patient')).to.be.undefined;
            });

            it("should have input state after input", function() {
                var node = test.createComponent(compFactory);
                // initialize state
                node.vni().inputStates({'patient': {
                    data: {
                        id: '001', 
                        name: 'Alice',
                        dob: '1979-01-23'
                    },
                    lm: 'LM1328113669.00000000000000001'
                }});

                var currentState = node.vni().inputStates('patient');
                currentState.should.be.an('object');
                currentState.should.have.all.keys( 'data', 'lm' );
            });

            it("should have input state data after input", function() {
                var node = test.createComponent(compFactory);

                // initialize state
                var patientState = {
                    data: { id: '001', name: 'Alice', dob: '1979-01-23' },
                    lm: 'LM1328113669.00000000000000001'
                };
                node.vni().inputStates({'patient':
                                                  _.mapObject(patientState, _.clone)});

                var currentState = node.vni().inputStates('patient');
                currentState.should.be.an('object');
		        currentState.data.should.eql( patientState.data );
		        currentState.lm.should.eql( patientState.lm );
            });
        });

        describe('#outputState', function() {

            it("should initially return nothing", function() {
                var node = test.createComponent(compFactory);
                expect(node.vni().outputState()).to.be.undefined;
            });

            it("should have a output state after input", function() {
                var node = test.createComponent(compFactory);
                // initialize state
                node.vni().outputState({
                    data: { id: '001', 
                             name: 'Alice', 
                             dob: '1979-01-23', 
                             glucose: '75',  
                             date: '2012-02-01'
                     },
                    lm: 'LM1328113669.00000000000000001'
                });

                var currentState = node.vni().outputState();
                currentState.should.be.an('object');
                currentState.should.have.all.keys( 'data', 'lm' );
            });

            it("should have an output state data after input", function() {
                var node = test.createComponent(compFactory);
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
                node.vni().outputState( _.mapObject(outputState, _.clone) );

                var currentState = node.vni().outputState();
                currentState.should.be.an('object');
                currentState.data.should.deep.eql( outputState.data );
                currentState.lm.should.be.a('string');
            });
        });
    });

    describe('functional behavior', function() {

    
        it("should have patient input state after input", function() {
            var node = test.createComponent(compFactory);
            test.sendData( node, 'patient',
                                         {id: '001',  name: 'Alice', dob: '1979-01-23' });
            stubs.promiseLater().then(function(){
                return node.vni().inputStates('patient');
            }).then(_.keys).then(_.sortBy).should.become(_.sortBy(['data', 'lm']));
        });

        it("should have patient input state data after input", function() {
            var node = test.createComponent(compFactory);
            test.sendData( node, 'patient',
                                         {id: '001',  name: 'Alice', dob: '1979-01-23' });
            stubs.promiseLater().then(function(){
                return node.vni().inputStates('patient');
            }).then(_.property('data')).should.become({id: '001',  name: 'Alice', dob: '1979-01-23' });
        });

        it("should have labwork input state after input", function() {
            var node = test.createComponent(compFactory);
            test.sendData( node, 'labwork',
                                         {id: '001',  glucose: '75',  date: '2012-02-01'});
            stubs.promiseLater().then(function(){
                return node.vni().inputStates('labwork');
            }).then(_.keys).then(_.sortBy).should.become(_.sortBy(['data', 'lm']));
        });

        it("should have labwork input state data after input", function() {
            var node = test.createComponent(compFactory);
            test.sendData( node, 'labwork',
                                         {id: '001',  glucose: '75',  date: '2012-02-01'});
            stubs.promiseLater().then(function(){
                return node.vni().inputStates('labwork');
            }).then(_.property('data')).should.become({id: '001',  glucose: '75',  date: '2012-02-01'});
        });

        it( "should have patient and labwork output state after input ports processing", function() {
            var node = test.createComponent(compFactory);
            return new Promise(function(done, fail){
                test.onOutPortData(node, 'error', fail);
                test.onOutPortData(node, 'output', done);
                test.sendData( node, 'patient',
                                     {id: '001',  name: 'Alice', dob: '1979-01-23' });
                test.sendData( node,'labwork',
                                     {id: '001',  glucose: '75',  date: '2012-02-01'});
             }).then(function(payload){
                payload.should.exist;
                payload.should.not.be.empty;
                payload.should.have.ownProperty('vnid');
                payload.vnid.should.equal('');
                payload.should.be.an('object');
                payload.should.have.ownProperty('data');
                payload.data.should.be.an('object');
                payload.data.should.have.all.keys( 'id', 'name', 'dob', 'glucose', 'date' );
                payload.data.id.should.equal('001');
                payload.data.name.should.equal('Alice');
                payload.data.dob.should.equal('1979-01-23');
                payload.data.glucose.should.equal('75');
                payload.data.date.should.equal('2012-02-01');
             });
        });
    });
});
