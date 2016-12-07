// rdf-load-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var _ = require('underscore');
var noflo = require('noflo');
var test = require('./common-test');
var rdfLoad = require('../components/rdf-load');
var rdfJsonld = require('../components/rdf-jsonld');

describe('rdf-load', function() {
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
    it("should load a json-ld graph", function() {
        this.timeout(6000);
        return test.createNetwork({
            load: rdfLoad
        }).then(function(network){
            var output = noflo.internalSocket.createSocket();
            network.processes.load.component.outPorts.output.attach(output);
            return new Promise(function(done) {
                output.on('data', done);
                network.graph.addInitial(john, 'load', 'input');
            });
        }).should.eventually.have.property('data').that.include.keys('triples');
    });
    it("should round trip a graph", function() {
        this.timeout(6000);
        // creating 2 node graph (rdfLoad & rdfJsonld components)
        return test.createNetwork({
            load: rdfLoad,
            jsonld: rdfJsonld
        }).then(function(network){
            // attach load and jsonld nodes together
            network.graph.addEdge('load', 'output', 'jsonld', 'input');
            network.graph.addInitial(frame, 'jsonld', 'frame');
            var output = noflo.internalSocket.createSocket();
            network.processes.jsonld.component.outPorts.output.attach(output);
            return new Promise(function(done) {
                output.on('data', done);
                network.graph.addInitial(cynthia, 'load', 'input');
            });
        }).should.eventually.have.property('data').that.eql(cynthia);
    });
});
