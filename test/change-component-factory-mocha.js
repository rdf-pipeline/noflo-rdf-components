// change-component-factory-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var _ = require('underscore');
var noflo = require('noflo');
var componentFactory = require('../components/change-component-factory.js');

describe('change-component-factory', function() {
    it("should trigger onchange function", function() {
        var handler;
        return Promise.resolve({
            inPorts:{input:{}},
            onchange: function(payloads) {
                handler(payloads);
            }
        }).then(componentFactory).then(createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            return new Promise(function(callback){
                handler = callback;
                sendData(component, 'input', "hello");
            });
        }).should.become({'input': "hello"});
    });
    it("should include previously sent payload", function() {
        var handler;
        return Promise.resolve({
            inPorts:{input:{}},
            outPorts:{output:{}},
            onchange: function(payloads) {
                handler(payloads);
                this.outPorts.output.send(payloads.input);
                this.outPorts.output.disconnect();
            }
        }).then(componentFactory).then(createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            return new Promise(function(callback){
                handler = callback;
                sendData(component, 'input', "hello");
            }).then(function(){
                return new Promise(function(callback){
                    handler = callback;
                    sendData(component, 'input', "world");
                });
            });
        }).should.become({output:"hello", input:"world"});
    });
    it("shouldn't confuse data with an undefined key on indexed port with incoming data on a non-indexed port", function() {
        var handler;
        return Promise.resolve({
            inPorts:{
                a:{indexBy:'id'},
                b:{indexBy:'id'},
                c:{}
            },
            onchange: function(payloads) {
                if (payloads.c) handler(payloads);
            }
        }).then(componentFactory).then(createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            return new Promise(function(callback){
                handler = callback;
                sendData(component, 'a', {d:"A"});
                sendData(component, 'b', {d:"B"});
                sendData(component, 'c', {d:"C"});
            });
        }).should.become({c:{d:"C"}}); // a and b should be absent because they're indexed
    });
    it("shouldn't confuse a non-indexed in port with undefined indexed output", function() {
        var handler;
        return Promise.resolve({
            inPorts:{
                a:{indexBy:'id'},
                b:{indexBy:'id'},
                c:{}
            },
            outPorts:{output:{indexBy:'id'}},
            onchange: function(payloads) {
                handler(payloads);
                this.outPorts.output.send(_.keys(payloads));
                this.outPorts.output.disconnect();
            }
        }).then(componentFactory).then(createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            return new Promise(function(callback){
                handler = callback;
                sendData(component, 'a', {d:"A"});
            }).then(function(){
                return new Promise(function(callback){
                    handler = callback;
                    sendData(component, 'c', {d:"C1"});
                });
            }).then(function(){
                return new Promise(function(callback){
                    handler = callback;
                    sendData(component, 'c', {d:"C2"});
                });
            });
        }).should.become({c:{d:"C2"}}); // output should be absent because it's indexed
    });
    it("shouldn't confuse a non-indexed port with undefined property output", function() {
        var handler;
        return Promise.resolve({
            inPorts:{
                a:{indexBy:'id'},
                b:{indexBy:'id'},
                c:{}
            },
            outPorts:{output:{indexBy:'id'}},
            onchange: function(payloads) {
                handler(payloads.output);
                this.outPorts.output.send(payloads.a);
                this.outPorts.output.disconnect();
            }
        }).then(componentFactory).then(createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            return new Promise(function(callback){
                handler = callback;
                sendData(component, 'a', {id:'undefined', d:"A"});
            }).then(function(){
                return new Promise(function(callback){
                    handler = callback;
                    sendData(component, 'c', {d:"C"});
                });
            });
        }).should.become(undefined); // a should be absent because it's indexed
    });
    it("wait until all required ports have data", function() {
        var handler;
        return Promise.resolve({
            inPorts:{
                a: {required: true},
                b: {required: true}
            },
            onchange: function(payloads) {
                handler(payloads);
            }
        }).then(componentFactory).then(createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            return new Promise(function(callback){
                handler = callback;
                sendData(component, 'a', "A");
                sendData(component, 'b', "B");
            });
        }).should.become({a: "A", b: "B"});
    });
    it("should execute onchange with matched incoming data packets using index key", function() {
        var handler;
        return Promise.resolve({
            inPorts:{
                a: {required: true, indexBy: 'aid'},
                b: {required: true, indexBy: 'bid'}
            },
            onchange: function(payloads) {
                handler(payloads);
            }
        }).then(componentFactory).then(createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            // Payload must be indexed and matched together with payload from other ports
            return new Promise(function(callback){
                handler = callback;
                sendData(component, 'a', {aid:"1", c: "A"});
                sendData(component, 'a', {aid:"2", c: "A"});
                sendData(component, 'a', {aid:"3", c: "A"});
                sendData(component, 'b', {bid:"2", c: "B"});
            });
        }).should.become({a: {aid: "2", c: "A"}, b: {bid: "2", c: "B"}});
    });
    it("map indexed data by jsonpointer", function() {
        var handler;
        return Promise.resolve({
            inPorts:{
                a: {required: true, indexBy: '/a/id'},
                b: {required: true, indexBy: '/b/id'}
            },
            onchange: function(payloads) {
                handler(payloads);
            }
        }).then(componentFactory).then(createComponent).then(function(component){
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
            onchange: function(payloads) {
                handler(payloads);
            }
        }).then(componentFactory).then(createComponent).then(function(component){
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
            return obj[this.nodeInstance.property];
        };
        return Promise.resolve({
            inPorts:{
                a: {required: true, indexBy: indexBy},
                b: {required: true, indexBy: indexBy},
                property: {ondata: function(property) {
                    this.nodeInstance.property = property;
                }}
            },
            onchange: function(payloads) {
                handler(payloads);
            }
        }).then(componentFactory).then(createComponent).then(function(component){
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
