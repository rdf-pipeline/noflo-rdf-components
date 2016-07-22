// http-delivery-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var fs = require('fs');
var http = require('http');
var os = require('os');
var path = require('path');
var _ = require('underscore');
var noflo = require('noflo');
var test = require('./common-test');
var stubs = require('./common-stubs');
var httpDelivery = require('../components/http-delivery');

describe('http-delivery', function() {
    var port = 1337;
    var origin = 'http://localhost:' + port;
    var endpoint = "http://10.255.241.10:10035/repositories/http-delivery-mocha";
    it("should receive a request using a sub-graph", function() {
        this.timeout(3000);
        return new Promise(function(done, fail) {
            test.createNetwork({
                delivery: "rdf-components/http-delivery-server"
            }).then(function(network){
                network.graph.addInitial("Hello World!", 'delivery', 'content');
                network.graph.addInitial('text/plain', 'delivery', 'type');
                network.graph.addInitial(port, 'delivery', 'listen');
                return new Promise(function(cb) {
                    http.get(origin + '/?vnid=', cb);
                });
            }).then(function(res){
                res.setEncoding('utf8');
                res.on('data', done);
            }).catch(fail);
        }).should.become("Hello World!");
    });
    it("should receive a request with a non-empty vnid", function() {
        this.timeout(3250);
        return new Promise(function(done, fail) {
            test.createNetwork({
                delivery: "rdf-components/http-delivery-server"
            }).then(function(network){
                network.graph.addInitial({vnid:'world',data:"Hello World!"}, 'delivery', 'content');
                network.graph.addInitial({vnid:'there',data:"Hello There!"}, 'delivery', 'content');
                network.graph.addInitial('text/plain', 'delivery', 'type');
                network.graph.addInitial(port, 'delivery', 'listen');
                return new Promise(function(cb) {
                    http.get(origin + '/?vnid=world', cb);
                });
            }).then(function(res){
                res.setEncoding('utf8');
                res.on('data', done);
            }).catch(fail);
        }).should.become("Hello World!");
    });
    it("should receive a request with a non-empty vnid", function() {
        this.timeout(3250);
        return new Promise(function(done, fail) {
            test.createNetwork({
                delivery: "rdf-components/http-delivery-server"
            }).then(function(network){
                network.graph.addInitial({vnid:'world',data:"Hello World!"}, 'delivery', 'content');
                network.graph.addInitial({vnid:'there',data:"Hello There!"}, 'delivery', 'content');
                network.graph.addInitial('text/plain', 'delivery', 'type');
                network.graph.addInitial(port, 'delivery', 'listen');
                return new Promise(function(cb) {
                    http.get(origin + '/?vnid=there', cb);
                });
            }).then(function(res){
                res.setEncoding('utf8');
                res.on('data', done);
            }).catch(fail);
        }).should.become("Hello There!");
    });
    xit("should round trip jsonld through SPARQL LOAD", function() {
        this.timeout(10000);
        if (!process.env['rdf-auth-file']) {
            process.env['rdf-auth-file'] = path.join(os.tmpdir(), 'rdf-auth');
        }
        var john = {
            "@context": "http://json-ld.org/contexts/person.jsonld",
            "@graph": [{
                "@id": "http://dbpedia.org/resource/John_Lennon",
                "name": "John Lennon",
                "spouse": "http://dbpedia.org/resource/Cynthia_Lennon"
            }]
        };
        return test.createNetwork({
            sparql: "rdf-components/rdf-sparql-clear-load-jsonld",
            construct: "rdf-components/rdf-construct-jsonld"
        }).then(function(network){
            network.graph.addInitial('rdf-auth-file', 'sparql', 'auth_file_env');
            network.graph.addInitial('rdf-auth-file', 'construct', 'auth_file_env');
            network.graph.addInitial(endpoint, 'sparql', 'sparql_endpoint');
            network.graph.addInitial(endpoint, 'construct', 'sparql_endpoint');
            network.graph.addInitial(port, 'sparql', 'listen');
            network.graph.addInitial(origin + '/', 'sparql', 'base_url');
            return stubs.promiseLater().then(function(){
                return new Promise(function(done) {
                    test.onOutPortData(network.processes.sparql.component, 'output', done);
                    network.graph.addInitial("urn:test:graph", 'sparql', 'target_graph_uri');
                    network.graph.addInitial(john, 'sparql', 'parsed_jsonld');
                });
            }).then(stubs.promiseLater).then(function(){
                return new Promise(function(done) {
                    test.onOutPortData(network.processes.construct.component, 'output', done);
                    network.graph.addInitial("urn:test:graph", 'construct', 'source_graph_uri');
                });
            });
        }).should.eventually.have.property('data').that.has.property('@id', "http://dbpedia.org/resource/John_Lennon");
    });
    xit("should round trip rdf file through SPARQL LOAD", function() {
        this.timeout(10000);
        if (!process.env['rdf-auth-file']) {
            process.env['rdf-auth-file'] = path.join(os.tmpdir(), 'rdf-auth');
        }
        var turtle = [
            '<http://dbpedia.org/resource/John_Lennon> <http://schema.org/spouse> <http://dbpedia.org/resource/Cynthia_Lennon> .',
            '<http://dbpedia.org/resource/John_Lennon> <http://xmlns.com/foaf/0.1/name> "John Lennon" .'
        ].join('\n');
        var file = path.join(os.tmpdir(), 'rdf-john.ttl');
        fs.writeFileSync(file, turtle, {encoding: 'utf-8'});
        return test.createNetwork({
            sparql: "rdf-components/rdf-sparql-clear-load-file",
            construct: "rdf-components/rdf-construct-jsonld"
        }).then(function(network){
            network.graph.addInitial('rdf-auth-file', 'sparql', 'auth_file_env');
            network.graph.addInitial('rdf-auth-file', 'construct', 'auth_file_env');
            network.graph.addInitial(endpoint, 'sparql', 'sparql_endpoint');
            network.graph.addInitial(endpoint, 'construct', 'sparql_endpoint');
            network.graph.addInitial(port, 'sparql', 'listen');
            network.graph.addInitial(origin + '/', 'sparql', 'base_url');
            return stubs.promiseLater().then(function(){
                return new Promise(function(done) {
                    test.onOutPortData(network.processes.sparql.component, 'output', done);
                    network.graph.addInitial("urn:test:graph", 'sparql', 'target_graph_uri');
                    network.graph.addInitial('text/turtle', 'sparql', 'rdf_type');
                    network.graph.addInitial('utf-8', 'sparql', 'rdf_encoding');
                    network.graph.addInitial(file, 'sparql', 'rdf_file');
                });
            }).then(stubs.promiseLater).then(function(){
                return new Promise(function(done) {
                    test.onOutPortData(network.processes.construct.component, 'output', done);
                    network.graph.addInitial("urn:test:graph", 'construct', 'source_graph_uri');
                });
            });
        }).should.eventually.have.property('data').that.has.property('@id', "http://dbpedia.org/resource/John_Lennon");
    });
});
