// rdf-update-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var _ = require('underscore');
var noflo = require('noflo');
var test = require('./common-test');
var rdfLoad = require('../components/rdf-load');
var rdfQuery = require('../components/rdf-query');
var rdfUpdate = require('../components/rdf-update');
var rdfJsonld = require('../components/rdf-jsonld');

describe('rdf-update', function() {
    var prefix = 'PREFIX dbpedia:<http://dbpedia.org/resource/>\n' +
        'PREFIX foaf:<http://xmlns.com/foaf/0.1/>\n' +
        'PREFIX xsd:<http://www.w3.org/2001/XMLSchema#>\n';
    var frame = {
        "@context": "http://json-ld.org/contexts/person.jsonld",
        "@graph": [{
            "@id": "http://dbpedia.org/resource/John_Lennon"
        }]
    };
    var john = {
        "@context": "http://json-ld.org/contexts/person.jsonld",
        "@graph": [{
            "@id": "http://dbpedia.org/resource/John_Lennon",
            "name": "John Lennon",
            "born": "1940-10-09",
            "spouse": [
                "http://dbpedia.org/resource/Cynthia_Lennon",
                {
                    "@id": "_:b0",
                    "name": "Yoko Ono"
                }
            ]
        }]
    };
    var cynthia = {
        "@context": "http://json-ld.org/contexts/person.jsonld",
        "@graph": [{
            "@id": "http://dbpedia.org/resource/John_Lennon",
            "born": "1940-10-09",
            "name": "John Lennon",
            "spouse": [{
                "@id": "http://dbpedia.org/resource/Cynthia_Lennon",
                "name": "Cynthia Lennon"
            },{
                "@id": "_:b0",
                "name": "Yoko Ono"
            }]
        }]
    };
    it("should update a graph", function() {
        this.timeout(5000);
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
        }).should.eventually.have.property('data', true);
    });
    it("should serialize a graph", function() {
        this.timeout(4000);
        return test.createNetwork({
            load: rdfLoad,
            update: rdfUpdate,
            jsonld: rdfJsonld
        }).then(function(network){
            network.graph.addEdge('load', 'output', 'update', 'input');
            network.graph.addEdge('update', 'output', 'jsonld', 'input');
            var update = prefix + 'INSERT DATA {dbpedia:Cynthia_Lennon foaf:name "Cynthia Lennon"}';
            network.graph.addInitial(update, 'update', 'update');
            network.graph.addInitial(frame, 'jsonld', 'frame');
            var output = noflo.internalSocket.createSocket();
            network.processes.jsonld.component.outPorts.output.attach(output);
            return new Promise(function(done) {
                output.on('data', done);
                network.graph.addInitial(john, 'load', 'input');
            });
        }).should.eventually.have.property('data').that.eql(cynthia);
    });
});
