// rdf-construct-mocha.js

var chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

var http = require('http');
var _ = require('underscore');
var os = require('os');
var fs = require('fs');
var path = require('path');
var noflo = require('noflo');
var test = require('./common-test');
var stubs = require('./common-stubs');
var rdfLoad = require('../components/rdf-load');
var rdfNtriples = require('../components/rdf-ntriples');
var requestTemplate = require('../components/request-template');

describe('rdf-insert subgraph', function() {
    var port = 1337;
    var endpoint = "http://10.255.241.10:10035/repositories/rdf-construct-mocha";
    var john = {
        "@context": "http://json-ld.org/contexts/person.jsonld",
        "@graph": [{
            "@id": "http://dbpedia.org/resource/John_Lennon",
            "name": "John Lennon",
            "spouse": "http://dbpedia.org/resource/Cynthia_Lennon"
        }]
    };
    it("should parse text/turtle", function() {
        var server = http.createServer();
        server.on('request', function(req, res) {
            res.end([
                '@prefix foaf: <http://xmlns.com/foaf/0.1/> .',
                '@prefix schema: <http://schema.org/> .',
                '<http://dbpedia.org/resource/John_Lennon>foaf:name "John Lennon" ; ',
                '    schema:spouse <http://dbpedia.org/resource/Cynthia_Lennon> . ',
            ].join('\n'));
        });
        server.listen(port);
        return test.createNetwork({
            construct: "rdf-components/rdf-construct",
            jsonld: "rdf-components/rdf-jsonld"
        }).then(function(network){
            network.graph.addEdge('construct', 'output', 'jsonld', 'input');
            network.graph.addInitial("http://localhost:" + port + "/", 'construct', 'sparql_endpoint');
            return new Promise(function(done) {
                test.onOutPortData(network.processes.jsonld.component, 'output', done);
                network.graph.addInitial("urn:test:graph", 'construct', 'source_graph');
            });
        }).should.eventually.have.property('@id', "http://dbpedia.org/resource/John_Lennon").notify(server.close.bind(server));
    });
    it("should parse text/turtle into JSON LD", function() {
        var server = http.createServer();
        server.on('request', function(req, res) {
            res.end([
                '@prefix foaf: <http://xmlns.com/foaf/0.1/> .',
                '@prefix schema: <http://schema.org/> .',
                '<http://dbpedia.org/resource/John_Lennon>foaf:name "John Lennon" ; ',
                '    schema:spouse <http://dbpedia.org/resource/Cynthia_Lennon> . ',
            ].join('\n'));
        });
        server.listen(port);
        return test.createNetwork({
            construct: "rdf-components/rdf-construct-jsonld"
        }).then(function(network){
            network.graph.addInitial("http://localhost:" + port + "/", 'construct', 'sparql_endpoint');
            return new Promise(function(done) {
                test.onOutPortData(network.processes.construct.component, 'output', done);
                network.graph.addInitial("urn:test:graph", 'construct', 'source_graph');
            });
        }).should.eventually.have.property('@id', "http://dbpedia.org/resource/John_Lennon").notify(server.close.bind(server));
    });
    xit("should round trip jsonld through SPARQL service", function() {
        if (!process.env['rdf-auth-file']) {
            process.env['rdf-auth-file'] = path.join(os.tmpdir(), 'rdf-auth');
        }
        return test.createNetwork({
            insert: "rdf-components/rdf-clear-insert",
            construct: "rdf-components/rdf-construct"
        }).then(function(network){
            network.graph.addInitial('rdf-auth-file', 'insert', 'auth_file_env');
            network.graph.addInitial('rdf-auth-file', 'construct', 'auth_file_env');
            network.graph.addInitial(endpoint, 'insert', 'sparql_endpoint');
            network.graph.addInitial(endpoint, 'construct', 'sparql_endpoint');
            return stubs.promiseLater().then(function(){
                return new Promise(function(done) {
                    test.onOutPortData(network.processes.insert.component, 'output', done);
                    network.graph.addInitial("urn:test:graph", 'insert', 'target_graph');
                    network.graph.addInitial(john, 'insert', 'jsonld');
                });
            }).then(stubs.promiseLater).then(function(){
                return new Promise(function(done) {
                    test.onOutPortData(network.processes.construct.component, 'output', done);
                    network.graph.addInitial("urn:test:graph", 'construct', 'source_graph');
                });
            });
        }).should.eventually.have.property('@id', "http://dbpedia.org/resource/John_Lennon");
    });
});
