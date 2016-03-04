// rdf-components-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var _ = require('underscore');
var path = require('path');
var noflo = require('noflo');
var test = require('./common-test');
var rdfLoad = require('../components/rdf-load');
var rdfQuery = require('../components/rdf-query');
var rdfUpdate = require('../components/rdf-update');
var rdfJsonld = require('../components/rdf-jsonld');
var rdfNtriples = require('../components/rdf-ntriples');

describe('rdf components', function() {
    var prefix = 'PREFIX dbpedia:<http://dbpedia.org/resource/>\n' +
        'PREFIX foaf:<http://xmlns.com/foaf/0.1/>\n' +
        'PREFIX xsd:<http://www.w3.org/2001/XMLSchema#>\n';
    var john = {
        "@context": "http://json-ld.org/contexts/person.jsonld",
        "@graph": [{
            "@id": "http://dbpedia.org/resource/John_Lennon",
            "name": "John Lennon",
            "born": "1940-10-09",
            "spouse": "http://dbpedia.org/resource/Cynthia_Lennon"
        }]
    };
    var cynthia = {
        "@context": "http://json-ld.org/contexts/person.jsonld",
        "@graph": [{
            "@id": "http://dbpedia.org/resource/John_Lennon",
            "born": "1940-10-09",
            "name": "John Lennon",
            "spouse": {
                "@id": "http://dbpedia.org/resource/Cynthia_Lennon",
                "name": "Cynthia Lennon"
            }
        }]
    };
    it("should load a json-ld graph", function() {
        return test.createNetwork({
            load: rdfLoad
        }).then(function(network){
            var output = noflo.internalSocket.createSocket();
            network.processes.load.component.outPorts.output.attach(output);
            return new Promise(function(done) {
                output.on('data', done);
                network.graph.addInitial(john, 'load', 'input');
            });
        }).should.eventually.include.keys('triples');
    });
    it("should round trip a graph", function() {
        return test.createNetwork({
            load: rdfLoad,
            jsonld: rdfJsonld
        }).then(function(network){
            network.graph.addEdge('load', 'output', 'jsonld', 'input');
            network.graph.addInitial(john, 'jsonld', 'frame');
            var output = noflo.internalSocket.createSocket();
            network.processes.jsonld.component.outPorts.output.attach(output);
            return new Promise(function(done) {
                output.on('data', done);
                network.graph.addInitial(john, 'load', 'input');
            });
        }).should.eventually.eql(john);
    });
    it("should query a graph", function() {
        return test.createNetwork({
            load: rdfLoad,
            query: rdfQuery
        }).then(function(network){
            network.graph.addEdge('load', 'output', 'query', 'input');
            var query = prefix + 'ASK {dbpedia:John_Lennon foaf:name ?name FILTER (?name = "John Lennon")}';
            network.graph.addInitial(query, 'query', 'query');
            var output = noflo.internalSocket.createSocket();
            network.processes.query.component.outPorts.output.attach(output);
            return new Promise(function(done) {
                output.on('data', done);
                network.graph.addInitial(john, 'load', 'input');
            });
        }).should.become(true);
    });
    it("should update a graph", function() {
        return test.createNetwork({
            load: rdfLoad,
            update: rdfUpdate,
            query: rdfQuery
        }).then(function(network){
            network.graph.addEdge('load', 'output', 'update', 'input');
            network.graph.addEdge('update', 'output', 'query', 'input');
            var update = prefix + 'INSERT DATA {dbpedia:Cynthia_Lennon foaf:name "Cynthia Lennon"}';
            network.graph.addInitial(update, 'update', 'update');
            var query = prefix + 'ASK {dbpedia:Cynthia_Lennon foaf:name "Cynthia Lennon"}';
            network.graph.addInitial(query, 'query', 'query');
            var output = noflo.internalSocket.createSocket();
            network.processes.query.component.outPorts.output.attach(output);
            return new Promise(function(done) {
                output.on('data', done);
                network.graph.addInitial(john, 'load', 'input');
            });
        }).should.become(true);
    });
    it("should serialize a graph", function() {
        return test.createNetwork({
            load: rdfLoad,
            update: rdfUpdate,
            jsonld: rdfJsonld
        }).then(function(network){
            network.graph.addEdge('load', 'output', 'update', 'input');
            network.graph.addEdge('update', 'output', 'jsonld', 'input');
            var update = prefix + 'INSERT DATA {dbpedia:Cynthia_Lennon foaf:name "Cynthia Lennon"}';
            network.graph.addInitial(update, 'update', 'update');
            network.graph.addInitial(john, 'jsonld', 'frame');
            var output = noflo.internalSocket.createSocket();
            network.processes.jsonld.component.outPorts.output.attach(output);
            return new Promise(function(done) {
                output.on('data', done);
                network.graph.addInitial(john, 'load', 'input');
            });
        }).should.eventually.eql(cynthia);
    });
    it("should round trip a graph through ntriples", function() {
        return test.createNetwork({
            loadJson: rdfLoad,
            ntriples: rdfNtriples,
            extractProperty: "objects/ExtractProperty",
            join: "objects/Join",
            loadNtriples: rdfLoad,
            jsonld: rdfJsonld
        }).then(function(network){
            network.graph.addEdge('loadJson', 'output', 'ntriples', 'input');
            network.graph.addEdge('ntriples', 'output', 'extractProperty', 'in');
            network.graph.addEdge('extractProperty', 'out', 'join', 'in');
            network.graph.addEdge('join', 'out', 'loadNtriples', 'input');
            network.graph.addEdge('loadNtriples', 'output', 'jsonld', 'input');
            network.graph.addInitial('text/turtle', 'loadNtriples', 'media');
            network.graph.addInitial('tokens', 'extractProperty', 'key');
            network.graph.addInitial('', 'join', 'delimiter');
            network.graph.addInitial(john, 'jsonld', 'frame');
            var output = noflo.internalSocket.createSocket();
            network.processes.jsonld.component.outPorts.output.attach(output);
            return new Promise(function(done, fail) {
                output.on('data', done);
                network.graph.addInitial(john, 'loadJson', 'input');
            });
        }).should.eventually.eql(john);
    });
});
