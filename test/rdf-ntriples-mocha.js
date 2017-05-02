// rdf-ntriples-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var _ = require('underscore');
var noflo = require('noflo');
var test = require('./common-test');

var join = require('../components/join-array');
var rdfLoad = require('../components/rdf-load');
var rdfJsonld = require('../components/rdf-jsonld');
var rdfNtriples = require('../components/rdf-ntriples');

describe('rdf-ntriples', function() {
    var frame = {
        "@context": "http://json-ld.org/contexts/person.jsonld",
        "@graph": [{
            "@id": "http://dbpedia.org/resource/John_Lennon"
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
    it("should round trip a graph through rdf-ntriples component", function() {
        this.timeout(4000);
        return test.createNetwork({
            loadJson: rdfLoad,
            ntriples: rdfNtriples,
            extract: "ExtractProperty",
            join: join,
            loadNtriples: rdfLoad,
            jsonld: rdfJsonld
        }).then(function(network){
            return new Promise(function(done, fail) { 
                var lastComponent = network.processes.jsonld.component;
                test.onOutPortData(lastComponent, 'output', done);
                test.onOutPortData(lastComponent, 'error', fail);

                network.graph.addEdge('loadJson', 'output', 'ntriples', 'input');
                network.graph.addEdge('ntriples', 'output', 'extract', 'in');
                network.graph.addEdge('extract', 'out', 'join', 'input');
                network.graph.addEdge('join', 'output', 'loadNtriples', 'input');
                network.graph.addEdge('loadNtriples', 'output', 'jsonld', 'input');

                network.graph.addInitial('', 'join', 'delimiter');
                network.graph.addInitial('text/turtle', 'loadNtriples', 'media');
                network.graph.addInitial(frame, 'jsonld', 'frame');
                network.graph.addInitial('data', 'extract', 'key');
                network.graph.addInitial(cynthia, 'loadJson', 'input');
            }).then(function(done) { 
                test.verifyState(done, '', cynthia);
            });
        });
    });
});
