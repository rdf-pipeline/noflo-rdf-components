// state-component-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var _ = require('underscore');
var noflo = require('noflo');
var stateComponent = require('../components/state-component.js');
var commonTest = require('./common-test');

describe('state-component', function() {
    it("should reject undefined definition", function() {
        return Promise.resolve().then(stateComponent).should.be.rejected;
    });
    it("should reject empty definition", function() {
        return Promise.resolve({}).then(stateComponent).should.be.rejected;
    });
    it("should reject empty inPorts", function() {
        return Promise.resolve({inPorts:{},onchange:function(){}}).then(stateComponent).should.be.rejected;
    });
    it("should reject no onchange function", function() {
        return Promise.resolve({
            inPorts:['in']
        }).then(stateComponent).then(commonTest.createComponent).then(function(component){
            return _.keys(component.inPorts);
        }).should.be.rejected;
    });
    it("should accept array of inPort names", function() {
        return Promise.resolve({
            inPorts:['in'],
            onchange:function(){}
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
        }).then(stateComponent).then(commonTest.createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            return new Promise(function(callback){
                handler = callback;
                commonTest.sendData(component, 'hello', "world");
            });
        }).should.become({'hello': "world"});
    });
    it("should pass previous resolve state as second argument", function() {
        var handler;
        return Promise.resolve({
            inPorts:['hello'],
            onchange: function(state, previously) {
                handler(previously);
                return state.hello;
            }
        }).then(stateComponent).then(commonTest.createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            return new Promise(function(callback){
                handler = callback;
                commonTest.sendData(component, 'hello', "world");
            }).then(function(){
                return new Promise(function(callback){
                    handler = callback;
                    commonTest.sendData(component, 'hello', "again");
                });
            });
        }).should.become("world");
    });
    it("shouldn't confuse an undefined key with non-indexed port", function() {
        var handler;
        return Promise.resolve({
            inPorts:{
                a:{indexBy:'id'},
                b:{indexBy:'id'},
                c:{}
            },
            onchange: function(state, previously) {
                if (state.c) handler(state);
            }
        }).then(stateComponent).then(commonTest.createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            return new Promise(function(callback){
                handler = callback;
                commonTest.sendData(component, 'a', {d:"A"});
                commonTest.sendData(component, 'b', {d:"B"});
                commonTest.sendData(component, 'c', {d:"C"});
            });
        }).should.become({c:{d:"C"}}); // a and b should be absent because their indexed
    });
    it("shouldn't confuse a non-indexed port with undefined indexed result", function() {
        var handler;
        return Promise.resolve({
            inPorts:{
                a:{indexBy:'id'},
                b:{indexBy:'id'},
                c:{}
            },
            onchange: function(state, previously) {
                handler(previously);
                return _.keys(state);
            }
        }).then(stateComponent).then(commonTest.createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            return new Promise(function(callback){
                handler = callback;
                commonTest.sendData(component, 'a', {d:"A"});
            }).then(function(){
                return new Promise(function(callback){
                    handler = callback;
                    commonTest.sendData(component, 'c', {d:"C1"});
                });
            }).then(function(){
                return new Promise(function(callback){
                    handler = callback;
                    commonTest.sendData(component, 'c', {d:"C2"});
                });
            });
        }).should.become(['c']); // a should be absent because it's indexed
    });
    it("shouldn't confuse a non-indexed port with undefined property result", function() {
        var handler;
        return Promise.resolve({
            inPorts:{
                a:{indexBy:'id'},
                b:{indexBy:'id'},
                c:{}
            },
            onchange: function(state, previously) {
                handler(previously);
                return _.keys(state);
            }
        }).then(stateComponent).then(commonTest.createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            return new Promise(function(callback){
                handler = callback;
                commonTest.sendData(component, 'a', {id:'undefined', d:"A"});
            }).then(function(){
                return new Promise(function(callback){
                    handler = callback;
                    commonTest.sendData(component, 'c', {d:"C"});
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
            onchange: function(state) {
                handler(state);
            }
        }).then(stateComponent).then(commonTest.createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            return new Promise(function(callback){
                handler = callback;
                commonTest.sendData(component, 'a', "A");
                commonTest.sendData(component, 'b', "B");
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
        }).then(stateComponent).then(commonTest.createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            return new Promise(function(callback){
                handler = callback;
                commonTest.sendData(component, 'a', {aid:"1", c: "A"});
                commonTest.sendData(component, 'a', {aid:"2", c: "A"});
                commonTest.sendData(component, 'a', {aid:"3", c: "A"});
                commonTest.sendData(component, 'b', {bid:"2", c: "B"});
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
        }).then(stateComponent).then(commonTest.createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            return new Promise(function(callback){
                handler = callback;
                commonTest.sendData(component, 'a', {a:{id:"1"}, c: "A"});
                commonTest.sendData(component, 'a', {a:{id:"2"}, c: "A"});
                commonTest.sendData(component, 'a', {a:{id:"3"}, c: "A"});
                commonTest.sendData(component, 'b', {b:{id:"2"}, c: "B"});
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
        }).then(stateComponent).then(commonTest.createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            return new Promise(function(callback){
                handler = callback;
                commonTest.sendData(component, 'a', {aid:"1", c: "A"});
                commonTest.sendData(component, 'a', {aid:"2", c: "A"});
                commonTest.sendData(component, 'a', {aid:"3", c: "A"});
                commonTest.sendData(component, 'b', {bid:"2", c: "B"});
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
        }).then(stateComponent).then(commonTest.createComponent).then(function(component){
            // have the handler call a Promise resolve function to
            // check that the data sent on the in port is passed to the handler
            return new Promise(function(callback){
                handler = callback;
                commonTest.sendData(component, 'property', 'id');
                commonTest.sendData(component, 'a', {id:"1", c: "A"});
                commonTest.sendData(component, 'a', {id:"2", c: "A"});
                commonTest.sendData(component, 'a', {id:"3", c: "A"});
                commonTest.sendData(component, 'b', {id:"2", c: "B"});
            });
        }).should.become({a: {id: "2", c: "A"}, b: {id: "2", c: "B"}});
    });
});
