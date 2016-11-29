// rdf-query-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var _ = require('underscore');
var noflo = require('noflo');
var test = require('./common-test');
var rdfLoad = require('../components/rdf-load');
var rdfQuery = require('../components/rdf-query');

describe('rdf-query', function() {
    var prefix = 'PREFIX dbpedia:<http://dbpedia.org/resource/>\n' +
        'PREFIX foaf:<http://xmlns.com/foaf/0.1/>\n' +
        'PREFIX xsd:<http://www.w3.org/2001/XMLSchema#>\n';
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
    it("should query a graph", function() {
        this.timeout(4000);
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
        }).should.eventually.have.property('data', true);
    });
});
