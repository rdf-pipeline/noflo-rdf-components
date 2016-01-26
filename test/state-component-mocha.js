// state-component-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var _ = require('underscore');
var noflo = require('noflo');
var stateComponent = require('../components/state-component.js');

describe('state-component', function() {
    it("should reject undefined definition", function() {
        return Promise.resolve().then(stateComponent).should.be.rejected;
    });
    it("should reject empty definition", function() {
        return Promise.resolve({}).then(stateComponent).should.be.rejected;
    });
    it("should reject empty inPorts", function() {
        return Promise.resolve({inPorts:{}}).then(stateComponent).should.be.rejected;
    });
    it("should accept array of inPort names", function() {
        return Promise.resolve({
            inPorts:['in']
        }).then(stateComponent).then(createComponent).then(function(component){
            return _.keys(component.inPorts);
        }).should.eventually.contain('in');
    });
    it("should trigger onchange function", function() {
        var handler;
        return Promise.resolve({
            inPorts:['hello'],
            onchange: function(state) {
                handler(state);
            }
        }).then(stateComponent).then(createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            return new Promise(function(callback){
                handler = callback;
                sendData(component, 'hello', "world");
            });
        }).should.become({'hello': "world"});
    });
    it("wait until all required ports have data", function() {
        var handler;
        return Promise.resolve({
            inPorts:{
                a: {required: true},
                b: {required: true}
            },
            onchange: function(state) {
                handler(state);
            }
        }).then(stateComponent).then(createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            return new Promise(function(callback){
                handler = callback;
                sendData(component, 'a', "A");
                sendData(component, 'b', "B");
            });
        }).should.become({a: "A", b: "B"});
    });
    it("map indexed data together", function() {
        var handler;
        return Promise.resolve({
            inPorts:{
                a: {required: true, indexBy: 'aid'},
                b: {required: true, indexBy: 'bid'}
            },
            onchange: function(state) {
                handler(state);
            }
        }).then(stateComponent).then(createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            return new Promise(function(callback){
                handler = callback;
                sendData(component, 'a', {aid:"1", c: "A"});
                sendData(component, 'a', {aid:"2", c: "A"});
                sendData(component, 'a', {aid:"3", c: "A"});
                sendData(component, 'b', {bid:"2", c: "B"});
            });
        }).should.become({a: {aid: "2", c: "A"}, b: {bid: "2", c: "B"}});
    });
    it("map indexed data by pointer", function() {
        var handler;
        return Promise.resolve({
            inPorts:{
                a: {required: true, indexBy: '/a/id'},
                b: {required: true, indexBy: '/b/id'}
            },
            onchange: function(state) {
                handler(state);
            }
        }).then(stateComponent).then(createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            return new Promise(function(callback){
                handler = callback;
                sendData(component, 'a', {a:{id:"1"}, c: "A"});
                sendData(component, 'a', {a:{id:"2"}, c: "A"});
                sendData(component, 'a', {a:{id:"3"}, c: "A"});
                sendData(component, 'b', {b:{id:"2"}, c: "B"});
            });
        }).should.become({a: {a:{id: "2"}, c: "A"}, b: {b:{id: "2"}, c: "B"}});
    });
    it("map indexed data by function", function() {
        var handler;
        return Promise.resolve({
            inPorts:{
                a: {required: true, indexBy: _.property('aid')},
                b: {required: true, indexBy: _.property('bid')}
            },
            onchange: function(state) {
                handler(state);
            }
        }).then(stateComponent).then(createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            return new Promise(function(callback){
                handler = callback;
                sendData(component, 'a', {aid:"1", c: "A"});
                sendData(component, 'a', {aid:"2", c: "A"});
                sendData(component, 'a', {aid:"3", c: "A"});
                sendData(component, 'b', {bid:"2", c: "B"});
            });
        }).should.become({a: {aid: "2", c: "A"}, b: {bid: "2", c: "B"}});
    });
    it("map indexed data by function context", function() {
        var handler;
        var indexBy = function(obj) {
            return obj[this.property];
        };
        return Promise.resolve({
            inPorts:{
                a: {required: true, indexBy: indexBy},
                b: {required: true, indexBy: indexBy},
                property: {ondata: function(property) {
                    this.property = property;
                }}
            },
            onchange: function(state) {
                handler(state);
            }
        }).then(stateComponent).then(createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            return new Promise(function(callback){
                handler = callback;
                sendData(component, 'property', 'id');
                sendData(component, 'a', {id:"1", c: "A"});
                sendData(component, 'a', {id:"2", c: "A"});
                sendData(component, 'a', {id:"3", c: "A"});
                sendData(component, 'b', {id:"2", c: "B"});
            });
        }).should.become({a: {id: "2", c: "A"}, b: {id: "2", c: "B"}});
    });
    function createComponent(getComponent) {
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
    function sendData(component, port, payload) {
        var socket = noflo.internalSocket.createSocket();
        component.inPorts[port].attach(socket);
        socket.send(payload);
        socket.disconnect();
        component.inPorts[port].detach(socket);
    }
});
