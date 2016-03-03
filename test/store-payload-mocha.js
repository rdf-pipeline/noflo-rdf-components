// store-payload-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);
var test = require('./common-test');

var _ = require('underscore');
var noflo = require('noflo');
var componentFactory = require('../src/event-component-factory.js');
var storePayload = require('../src/store-payload.js');

describe('store-payload', function() {
    it("should include previously sent payload", function() {
        var handler;
        return Promise.resolve({
            inPorts:{input:{ondata:function(payload) {
                storePayload(this, payload.vnid, payload);
                var payloads = storePayload(this, payload.vnid);
                handler(payloads);
                this.nodeInstance.outPorts.output.send(payloads.input);
                this.nodeInstance.outPorts.output.disconnect();
            }}},
            outPorts:{output:{ondata:function(payload) {
                storePayload(this, payload.vnid, payload);
            }}}
        }).then(componentFactory).then(test.createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            return new Promise(function(callback){
                handler = callback;
                test.sendData(component, 'input', "hello");
            }).then(function(){
                return new Promise(function(callback){
                    handler = callback;
                    test.sendData(component, 'input', "world");
                });
            });
        }).should.become({output:"hello", input:"world"});
    });
    it("should return matched incoming data packets using index key", function() {
        var handler;
        var ondata = function(payload) {
            storePayload(this, payload.vnid, payload);
            var payloads = storePayload(this, payload.vnid);
            if (payloads.b) handler(payloads);
        };
        return Promise.resolve({
            inPorts:{
                a: {required: true, ondata:ondata},
                b: {required: true, ondata:ondata}
            }
        }).then(componentFactory).then(test.createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            // Payload must be indexed and matched together with payload from other ports
            return new Promise(function(callback){
                handler = callback;
                test.sendData(component, 'a', {vnid:"1", c: "A"});
                test.sendData(component, 'a', {vnid:"2", c: "A"});
                test.sendData(component, 'a', {vnid:"3", c: "A"});
                test.sendData(component, 'b', {vnid:"2", c: "B"});
            });
        }).should.become({a: {vnid: "2", c: "A"}, b: {vnid: "2", c: "B"}});
    });
    it("should use empty string as wild card match", function() {
        var handler;
        var ondata = function(payload) {
            storePayload(this, payload.vnid, payload);
            var payloads = storePayload(this, payload.vnid);
            if (payloads.b) handler(payloads);
        };
        return Promise.resolve({
            inPorts:{
                a: {required: true, ondata:ondata},
                b: {required: true, ondata:ondata}
            }
        }).then(componentFactory).then(test.createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            // Payload must be indexed and matched together with payload from other ports
            return new Promise(function(callback){
                handler = callback;
                test.sendData(component, 'a', {vnid:'', c: "A"});
                test.sendData(component, 'b', {vnid:"2", c: "B"});
            });
        }).should.become({a: {vnid: '', c: "A"}, b: {vnid: "2", c: "B"}});
    });
    it("should use no vnid as wild card match", function() {
        var handler;
        var ondata = function(payload) {
            storePayload(this, payload.vnid, payload);
            var payloads = storePayload(this, payload.vnid);
            if (payloads.b) handler(payloads);
        };
        return Promise.resolve({
            inPorts:{
                a: {required: true, ondata:ondata},
                b: {required: true, ondata:ondata}
            }
        }).then(componentFactory).then(test.createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            // Payload must be indexed and matched together with payload from other ports
            return new Promise(function(callback){
                handler = callback;
                test.sendData(component, 'a', {c: "A"});
                test.sendData(component, 'b', {vnid:"2", c: "B"});
            });
        }).should.become({a: {c: "A"}, b: {vnid: "2", c: "B"}});
    });
    it("should pass payload from all addressable sockets", function() {
        var handler;
        var ondata = function(payload, socketIndex) {
            storePayload(this, payload.vnid, payload, socketIndex);
            var payloads = storePayload(this, payload.vnid);
            if (payloads.c) handler(payloads);
        };
        return Promise.resolve({
            inPorts:{
                a: {required: true, ondata:ondata},
                b: {required: true, addressable: true, ondata:ondata},
                c: {required: true, ondata:ondata}
            }
        }).then(componentFactory).then(test.createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            // Payload must be indexed and matched together with payload from other ports
            return new Promise(function(callback){
                handler = callback;
                test.sendData(component, 'a', {a: "A"});
                test.sendData(component, 'b', {b: "B1"});
                test.sendData(component, 'b', {vnid:"1", b: "B2"});
                test.sendData(component, 'b', {vnid:"1", b: "B3"});
                test.sendData(component, 'c', {vnid:"1", c: "C"});
            });
        }).should.become({a: {a:"A"}, b: [{b: "B1"}, {vnid: "1", b: "B2"}, {vnid: "1", b: "B3"}], c: {vnid: "1", c: "C"}});
    });
});
