// rdf-jsonld-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);
var expect = chai.expect;

var _ = require('underscore');
var noflo = require('noflo');
var test = require('./common-test');
var rdfLoad = require('../components/rdf-load');
var rdfJsonld = require('../components/rdf-jsonld');

describe('rdf-jsonld', function() {
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

    var lennons_framed = {
        "@context": "http://json-ld.org/contexts/person.jsonld",
        "@graph": [{
            "@id": "http://dbpedia.org/resource/John_Lennon",
            "born": "1940-10-09",
            "name": "John Lennon",
            "spouse": [{
                "@id": "http://dbpedia.org/resource/Cynthia_Lennon",
                "name": "Cynthia Lennon"
            },{
                "name": "Yoko Ono"
            }]
        }]
    };

    it('should throw an error if no input was specified', function() {
        this.nodeInstance = {};
        expect(rdfJsonld.updater.bind(this, undefined)).to.throw(Error,
               "Rdf-Jsonld component requires input to parse!");
    });

    it('should throw an error if input is empty', function() {
        this.nodeInstance = {};
        expect(rdfJsonld.updater.bind(this, '')).to.throw(Error,
            "Rdf-Jsonld component requires input to parse!");
    });

    it('should throw an error if frame is empty', function() {
        this.nodeInstance = {};
        expect(rdfJsonld.updater.bind(this, cynthia, '')).to.throw(Error,
            "Rdf-Jsonld component requires frame to parse!");
    });

    it('should throw an error if frame cannot be parsed', function() {
        this.nodeInstance = {};
        expect(rdfJsonld.updater.bind(this, cynthia, 'A bad frame')).to.throw(Error,
            "Rdf-Jsonld component is unable to parse frame: Unexpected token A!");
    });

    it('should throw an error if filter Bnode attributes is empty', function() {
        this.nodeInstance = {};
        expect(rdfJsonld.updater.bind(this, cynthia, frame, '')).to.throw(Error,
            "Rdf-Jsonld component requires filter bNode attributes to parse!");
    });

    it('should throw an error if filter Bnode attributes cannot be parsed', function() {
        this.nodeInstance = {};
        expect(rdfJsonld.updater.bind(this, cynthia, frame, 'Garbage')).to.throw(Error,
            "Rdf-Jsonld component is unable to parse filter bNode attributes: Unexpected token G!");
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

    it("should round trip a graph with a frame", function() {
        this.timeout(6000);
        // creating 2 node graph (rdfLoad & rdfJsonld components)
        return test.createNetwork({
            load: rdfLoad,
            jsonld: rdfJsonld
        }).then(function(network){
            // attach load and jsonld nodes together
            network.graph.addEdge('load', 'output', 'jsonld', 'input');
            network.graph.addInitial(frame, 'jsonld', 'frame');
            network.graph.addInitial(['id', '_id', '@id'], 'jsonld', 'filter_bnode_attrs');
            var output = noflo.internalSocket.createSocket();
            network.processes.jsonld.component.outPorts.output.attach(output);
            return new Promise(function(done) {
                output.on('data', done);
                network.graph.addInitial(cynthia, 'load', 'input');
            });
        }).should.eventually.have.property('data').that.eql(lennons_framed);
    });
});
