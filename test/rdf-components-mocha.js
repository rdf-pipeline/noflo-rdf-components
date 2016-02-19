// rdf-components-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var _ = require('underscore');
var path = require('path');
var noflo = require('noflo');
var rdfLoad = require('../components/rdf-load');
var rdfQuery = require('../components/rdf-query');
var rdfUpdate = require('../components/rdf-update');
var rdfJsonld = require('../components/rdf-jsonld');

describe('rdf components', function() {
    var prefix = 'PREFIX dbpedia:<http://dbpedia.org/resource/>\n' +
        'PREFIX foaf:<http://xmlns.com/foaf/0.1/>\n' +
        'PREFIX xsd:<http://www.w3.org/2001/XMLSchema#>\n';
    var john = {
        "@context": "http://json-ld.org/contexts/person.jsonld",
        "@id": "http://dbpedia.org/resource/John_Lennon",
        "name": "John Lennon",
        "born": "1940-10-09",
        "spouse": "http://dbpedia.org/resource/Cynthia_Lennon"
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
        return createNetwork({
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
    it("should query a graph", function() {
        return createNetwork({
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
        return createNetwork({
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
        return createNetwork({
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
});

/**
 * Creates and starts a noflo.Network with a component for every component module
 * given, however, no edges are present.
 * Usage:
 *  createNetwork({name:require('../components/rdf')}).then(function(network){
 *      network.processes.name.component is the component instance
 *      network.graph.addEdge('name', 'output', 'name', 'input') to add edge
 *      network.graph.addInitial(data, 'name', 'input') to send data
 *  });
 */
function createNetwork(componentModules) {
    var graph = new noflo.Graph();
    _.each(componentModules, function(module, name) {
        // maps node to factory
        graph.addNode(name, name);
    });
    return new Promise(function(resolve, reject){
        noflo.createNetwork(graph, function(err, network) {
            if (err instanceof noflo.Network) network = err;
            else if (err) return reject(err);
            _.each(componentModules, function(module, name) {
                // maps factory to module
                network.loader.components[name] = module;
            });
            network.connect(function(err){
                if (err) return reject(err);
                network.start();
                resolve(network);
            });
        }, true);
    });
}
