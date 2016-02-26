// promise-output--mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var _ = require('underscore');
var noflo = require('noflo');
var componentFactory = require('../src/noflo-component-factory');
var promiseOutput = require('../src/promise-output');
var test = require('./common-test');

describe('promise-output', function() {
    it("should resolve ondata function", function() {
        return new Promise(function(done, fail) {
            var node = test.createComponent(componentFactory({
                inPorts:{input:{
                    ondata: promiseOutput(function(payload){
                        return payload + " world";
                    })
                }},
                outPorts: promiseOutput.outPorts
            }));
            test.onOutPortData(node, 'output', done);
            test.onOutPortData(node, 'error', fail);
            test.sendData(node, 'input', "hello");
        }).should.become("hello world");
    });
    it("should resolve second ondata function call", function() {
        return new Promise(function(done, fail) {
            var node = test.createComponent(componentFactory({
                inPorts:{input:{
                    ondata: promiseOutput(function(payload){
                        if ("hello" == payload) return payload + " world";
                    })
                }},
                outPorts: promiseOutput.outPorts
            }));
            test.onOutPortData(node, 'output', done);
            test.onOutPortData(node, 'error', fail);
            test.sendData(node, 'input', "poke");
            test.sendData(node, 'input', "hello");
        }).should.become("hello world");
    });
    it("should send multiple packets on array result for ondata function", function() {
        return new Promise(function(done, fail) {
            var node = test.createComponent(componentFactory({
                inPorts:{input:{
                    ondata: promiseOutput(function(payload){
                        return [payload, payload + " world"];
                    })
                }},
                outPorts: promiseOutput.outPorts
            }));
            test.onOutPortData(node, 'output', function(){
                test.onOutPortData(node, 'output', done);
            });
            test.sendData(node, 'input', "hello");
        }).should.become("hello world");
    });
    it("should reject ondata function", function() {
        return new Promise(function(done, fail) {
            var node = test.createComponent(componentFactory({
                inPorts:{input:{
                    ondata: promiseOutput(function(payload){
                        throw payload + " world";
                    })
                }},
                outPorts: promiseOutput.outPorts
            }));
            test.onOutPortData(node, 'output', done);
            test.onOutPortData(node, 'error', fail);
            test.sendData(node, 'input', "hello");
        }).should.be.rejectedWith("hello world");
    });
    it("should log rejections to console.error when no reject port attached", function() {
        var console_error = console.error;
        return new Promise(function(done, fail) {
            var node = test.createComponent(componentFactory({
                inPorts:{input:{
                    ondata: promiseOutput(function(payload){
                        throw payload + " world";
                    })
                }},
                outPorts: promiseOutput.outPorts
            }));
            console.error = fail;
            test.onOutPortData(node, 'output', done);
            test.sendData(node, 'input', "hello");
        }).then(function(resolved) {
            console.error = console_error;
            return resolved;
        }, function(rejected){
            console.error = console_error;
            throw rejected;
        }).should.be.rejectedWith("hello world");
    });
});
