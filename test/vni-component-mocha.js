// vni-component-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var _ = require('underscore');
var noflo = require('noflo');
var vniComponent = require('../components/vni-component.js');

describe('state-component', function() {
    it("should reject undefined definition", function() {
        return Promise.resolve().then(vniComponent).should.be.rejected;
    });
    it("should reject empty definition", function() {
        return Promise.resolve({}).then(vniComponent).should.be.rejected;
    });
    it("should reject no onstatechange function", function() {
        return Promise.resolve({inPorts:['in']}).then(vniComponent).should.be.rejected;
    });
    it("should trigger onstatechange function", function() {
        var handler;
        return Promise.resolve({
            inPorts:['hello'],
            onstatechange: function(state) {
                handler(state);
            }
        }).then(vniComponent).then(createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            return new Promise(function(callback){
                handler = callback;
                sendData(component, 'hello', "world");
            });
        }).should.become({'hello': "world"});
    });
    it("should trigger onstatechange function", function() {
        var handler;
        return Promise.resolve({
            inPorts:['hello'],
            onstatechange: function(state) {
                handler(state);
            }
        }).then(vniComponent).then(createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            return new Promise(function(callback){
                handler = callback;
                sendData(component, 'hello', {vnid:'ID', state: "state"});
            });
        }).should.become({'hello': "state"});
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
