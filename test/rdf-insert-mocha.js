// rdf-insert-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var http = require('http');
var _ = require('underscore');
var path = require('path');
var noflo = require('noflo');
var test = require('./common-test');
var rdfLoad = require('../components/rdf-load');
var rdfNtriples = require('../components/rdf-ntriples');
var requestTemplate = require('../components/request-template');

describe('rdf-insert subgraph', function() {
    var port = 1337;
    var server = http.createServer();
    server.on('request', function(req, res) {
        var body = [];
        req.on('data', function(chunk) {
            body.push(chunk);
        }).on('end', function() {
            body = Buffer.concat(body).toString();
            res.end(body);
        });
    });
    before(function(){
        server.listen(port);
    });
    after(function(){
        server.close();
    });
    var john = {
        "@context": "http://json-ld.org/contexts/person.jsonld",
        "@graph": [{
            "@id": "http://dbpedia.org/resource/John_Lennon",
            "name": "John Lennon",
            "born": "1940-10-09",
            "spouse": "http://dbpedia.org/resource/Cynthia_Lennon"
        }]
    };
    var sparql = 'INSERT DATA {\n' +
        '<http://dbpedia.org/resource/John_Lennon> <http://schema.org/birthDate> "1940-10-09"^^<http://www.w3.org/2001/XMLSchema#dateTime> .\n' +
        '<http://dbpedia.org/resource/John_Lennon> <http://schema.org/spouse> <http://dbpedia.org/resource/Cynthia_Lennon> .\n' +
        '<http://dbpedia.org/resource/John_Lennon> <http://xmlns.com/foaf/0.1/name> "John Lennon" .\n' +
        '}\n';
    it("should POST jsonld as SPARQL INSERT", function() {
        return test.createNetwork({
            loadJson: rdfLoad,
            ntriples: rdfNtriples,
            request: requestTemplate
        }).then(function(network){
            var output = noflo.internalSocket.createSocket();
            network.processes.request.component.outPorts.output.attach(output);
            return new Promise(function(done) {
                output.on('data', done);
                network.graph.addEdge('loadJson', 'output', 'ntriples', 'input');
                network.graph.addEdge('ntriples', 'output', 'request', 'input');
                network.graph.addInitial('POST', 'request', 'method');
                network.graph.addInitial("http://localhost:" + port + "/", 'request', 'url');
                network.graph.addInitial({'Content-Type': 'text/turtle'}, 'request', 'headers');
                network.graph.addInitial('INSERT DATA {\n{{#each tokens}}{{{this}}}{{/each}}\n}', 'request', 'body');
                network.graph.addInitial(john, 'loadJson', 'input');
            }).then(function(sparql){
                return sparql.replace(/\s+/g,'\n').trim();
            });
        }).should.become(sparql.replace(/\s+/g,'\n').trim());
    });
    it("should POST jsonld as SPARQL INSERT using the default graph", function() {
        return test.createNetwork({
            insert: "rdf-components/rdf-insert"
        }).then(function(network){
            var output = noflo.internalSocket.createSocket();
            network.processes.insert.component.outPorts.output.attach(output);
            return new Promise(function(done) {
                output.on('data', done);
                network.graph.addInitial("http://localhost:" + port + "/", 'insert', 'sparql_endpoint');
                network.graph.addInitial(john, 'insert', 'jsonld');
            }).then(function(sparql){
                return _.isString(sparql) ? sparql.replace(/\s+/g,'\n').trim() : sparql;
            });
        }).should.become(sparql.replace(/\s+/g,'\n').trim());
    });
});
