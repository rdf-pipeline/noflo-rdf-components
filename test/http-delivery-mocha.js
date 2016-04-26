// http-delivery-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var http = require('http');
var _ = require('underscore');
var noflo = require('noflo');
var test = require('./common-test');
var httpDelivery = require('../components/http-delivery');

describe('http-delivery', function() {
    it("should receive a request using a sub-graph", function() {
        return new Promise(function(done, fail) {
            test.createNetwork({
                delivery: "rdf-components/http-delivery-server"
            }).then(function(network){
                network.graph.addInitial("Hello World!", 'delivery', 'content');
                network.graph.addInitial('text/plain', 'delivery', 'type');
                network.graph.addInitial(1337, 'delivery', 'listen');
                return new Promise(function(cb) {
                    http.get('http://localhost:1337/?vnid=', cb);
                });
            }).then(function(res){
                res.setEncoding('utf8');
                res.on('data', done);
            }).catch(fail);
        }).should.become("Hello World!");
    });
    it("should receive a request with a non-empty vnid", function() {
        return new Promise(function(done, fail) {
            test.createNetwork({
                delivery: "rdf-components/http-delivery-server"
            }).then(function(network){
                network.graph.addInitial({vnid:'world',data:"Hello World!"}, 'delivery', 'content');
                network.graph.addInitial({vnid:'there',data:"Hello There!"}, 'delivery', 'content');
                network.graph.addInitial('text/plain', 'delivery', 'type');
                network.graph.addInitial(1337, 'delivery', 'listen');
                return new Promise(function(cb) {
                    http.get('http://localhost:1337/?vnid=world', cb);
                });
            }).then(function(res){
                res.setEncoding('utf8');
                res.on('data', done);
            }).catch(fail);
        }).should.become("Hello World!");
    });
    it("should receive a request with a non-empty vnid", function() {
        return new Promise(function(done, fail) {
            test.createNetwork({
                delivery: "rdf-components/http-delivery-server"
            }).then(function(network){
                network.graph.addInitial({vnid:'world',data:"Hello World!"}, 'delivery', 'content');
                network.graph.addInitial({vnid:'there',data:"Hello There!"}, 'delivery', 'content');
                network.graph.addInitial('text/plain', 'delivery', 'type');
                network.graph.addInitial(1337, 'delivery', 'listen');
                return new Promise(function(cb) {
                    http.get('http://localhost:1337/?vnid=there', cb);
                });
            }).then(function(res){
                res.setEncoding('utf8');
                res.on('data', done);
            }).catch(fail);
        }).should.become("Hello There!");
    });
});
