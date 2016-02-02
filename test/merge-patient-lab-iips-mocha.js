// merge-patient-lab-iips-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var _ = require('underscore');
var noflo = require('noflo');
var getComponent = require('../components/merge-patient-lab-iips').getComponent;

describe('merge-patient-lab-iips', function() {
    it("should have rpf object on nodeInstance", function() {
        return Promise.resolve(createComponent()).then(function(component){
            return component.rpf;
        }).should.be.an('object');
    });
    it("should have createVni function", function() {
        return Promise.resolve(createComponent()).then(function(component){
            return component.rpf.createVni;
        }).should.be.a('function');
    });
    it("createVni should return an object", function() {
        return Promise.resolve(createComponent()).then(function(component){
            return component.rpf.createVni('');
        }).should.be.an('object');
    });
    describe('#createVni', function() {
        it("should have getInputState function", function() {
            return Promise.resolve(createComponent()).then(function(component){
                return component.rpf.createVni('').getInputState;
            }).should.be.a('function');
        });
        it("should have getOutputState function", function() {
                return Promise.resolve(createComponent()).then(function(component){
                return component.rpf.createVni('').getOutputState;
            }).should.be.a('function');
        });
        describe('#getInputState', function() {
            it("should initially return nothing", function() {
                return Promise.resolve(createComponent()).then(function(component){
                    return component.rpf.createVni('').getInputState('patient', '', '');
                }).should.become(undefined);
            });
            it("should have patient input state after input", function() {
                return Promise.resolve(createComponent()).then(function(component){
                    var patient = noflo.internalSocket.createSocket();
                    component.inPorts.patient.attach(patient);
                    patient.send({id: '001',  name: 'Alice', dob: '1979-01-23' });
                    patient.disconnect();
                    component.inPorts.patient.detach(patient);
                    return component.rpf.createVni('').getInputState('patient', '', '');
                }).then(_.keys).then(_.sortBy).should.become(_.sortBy(['data','lm', 'previousLms', 'selfPort']));
            });
            it("should have patient input state data after input", function() {
                return Promise.resolve(createComponent()).then(function(component){
                    var patient = noflo.internalSocket.createSocket();
                    component.inPorts.patient.attach(patient);
                    patient.send({id: '001',  name: 'Alice', dob: '1979-01-23' });
                    patient.disconnect();
                    component.inPorts.patient.detach(patient);
                    return component.rpf.createVni('').getInputState('patient', '', '');
                }).then(_.property('data')).should.become({id: '001',  name: 'Alice', dob: '1979-01-23' });
            });
            it("should have labwork input state after input", function() {
                return Promise.resolve(createComponent()).then(function(component){
                    var labwork = noflo.internalSocket.createSocket();
                    component.inPorts.labwork.attach(labwork);
                    labwork.send({id: '001',  glucose: '75',  date: '2012-02-01'});
                    labwork.disconnect();
                    component.inPorts.patient.detach(labwork);
                    return component.rpf.createVni('').getInputState('labwork', '', '');
                }).then(_.keys).then(_.sortBy).should.become(_.sortBy(['data','lm', 'previousLms', 'selfPort']));
            });
            it("should have patient input state data after input", function() {
                return Promise.resolve(createComponent()).then(function(component){
                    var labwork = noflo.internalSocket.createSocket();
                    component.inPorts.labwork.attach(labwork);
                    labwork.send({id: '001',  glucose: '75',  date: '2012-02-01'});
                    labwork.disconnect();
                    component.inPorts.patient.detach(labwork);
                    return component.rpf.createVni('').getInputState('labwork', '', '');
                }).then(_.property('data')).should.become({id: '001',  glucose: '75',  date: '2012-02-01'});
            });
        });
        describe('#getOutputState', function() {
            it("should initially return nothing", function() {
                return Promise.resolve(createComponent()).then(function(component){
                    return component.rpf.createVni('').getOutputState();
                }).should.become(undefined);
            });
            it("should have a output state after input", function() {
                return Promise.resolve(createComponent()).then(function(component){
                    var patient = noflo.internalSocket.createSocket();
                    var labwork = noflo.internalSocket.createSocket();
                    component.inPorts.patient.attach(patient);
                    patient.send({id: '001',  name: 'Alice', dob: '1979-01-23' });
                    patient.disconnect();
                    component.inPorts.labwork.attach(labwork);
                    labwork.send({id: '001',  glucose: '75',  date: '2012-02-01'});
                    labwork.disconnect();
                    component.inPorts.patient.detach(labwork);
                    component.inPorts.patient.detach(patient);
                    return component.rpf.createVni('').getOutputState();
                }).then(_.keys).then(_.sortBy).should.become(_.sortBy(['data','lm', 'previousLms', 'selfPort']));
            });
            it("should have an output state data after input", function() {
                return Promise.resolve(createComponent()).then(function(component){
                    var patient = noflo.internalSocket.createSocket();
                    var labwork = noflo.internalSocket.createSocket();
                    component.inPorts.patient.attach(patient);
                    patient.send({id: '001',  name: 'Alice', dob: '1979-01-23' });
                    patient.disconnect();
                    component.inPorts.labwork.attach(labwork);
                    labwork.send({id: '001',  glucose: '75',  date: '2012-02-01'});
                    labwork.disconnect();
                    component.inPorts.patient.detach(labwork);
                    component.inPorts.patient.detach(patient);
                    return component.rpf.createVni('').getOutputState();
                }).then(_.property('data')).should.become({id: '001',  name: 'Alice', dob: '1979-01-23', glucose: '75',  date: '2012-02-01'});
            });
        });
    });
});

function createComponent() {
    var component = getComponent();
    _.forEach(component.inPorts, function(port, name) {
        port.nodeInstance = component;
        port.name = name;
    });
    _.forEach(component.outPorts, function(port, name) {
        port.nodeInstance = component;
        port.name = name;
    });
    return component;
}
