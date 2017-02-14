// rdf-construct-mocha.js

var chai = require('chai');
var expect = chai.expect;
chai.should();
chai.use(require('chai-as-promised'));


var util = require('util');

var http = require('http');
var _ = require('underscore');

var os = require('os');
var fs = require('fs');
var request = require('request');

var noflo = require('noflo');

var test = require('./common-test');
var stubs = require('./common-stubs');
var rdfLoad = require('../components/rdf-load');
var rdfNtriples = require('../components/rdf-ntriples');
var requestTemplate = require('../components/request-template');


describe('rdf-construct subgraph', function() {
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

    it("should parse text/turtle", function(done) {
        this.timeout(3250);

        var server = http.createServer();
        afterEach(_.once(server.close.bind(server)));
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
                network.graph.addInitial("urn:test:graph", 'construct', 'source_graph_uri');

            }).then(function(result) { 
                result.should.be.an('object');
                result.data.should.deep.equal([ 
                    { '@id': 'http://dbpedia.org/resource/John_Lennon',
                      'http://xmlns.com/foaf/0.1/name': 'John Lennon',
                      'http://schema.org/spouse': { 
                           '@id': 'http://dbpedia.org/resource/Cynthia_Lennon' } 
                    } 
                ]);
                done();
            }).catch(function(e) { 
                throw Error('should parse text/turtle test exception: ',e);
            });
        });
    });

    it("should parse text/turtle into JSON LD", function(done) {
        this.timeout(3250);

        var server = http.createServer();
        afterEach(_.once(server.close.bind(server)));
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
                var frame = { 
                    "@context": {
                        "_id": "@id",
                        "id": "@id",
                        "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
                        "label": {
                            "@id": "rdfs:label"
                        }
                    }
                };
                network.graph.addInitial(frame, 'construct', 'frame');
                network.graph.addInitial("urn:test:graph", 'construct', 'source_graph_uri');

            }).then(function(result) { 
                result.should.be.an('object');
                expect(result.error).to.be.undefined;
                result.data.should.have.all.keys('@context', '@graph');
                result.data.should.deep.equal(
                    { '@context': 
                         { _id: '@id',
                           id: '@id',
                           rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
                           label: { '@id': 'rdfs:label' } },
                      '@graph': [
                         { id: 'http://dbpedia.org/resource/Cynthia_Lennon' },
                         { id: 'http://dbpedia.org/resource/John_Lennon',
                           'http://schema.org/spouse': { 
                               id: 'http://dbpedia.org/resource/Cynthia_Lennon' 
                           },
                           'http://xmlns.com/foaf/0.1/name': 'John Lennon' 
                         } 
                      ] 
                    }
                );
                done();
            });
        });
    });

    it("should round trip jsonld through SPARQL service", function(done) {
        this.timeout(5000);

        // Verify we have the rdf_auth_file env variable set so we have auth credentials
        // Info on how to set auth credentials: 
        if (!process.env['rdf_auth_file']) {
            console.warn("    The \"round trip jsonld through SPARQL service\" test requires an RDF auth file path in env var \"rdf_auth_file\"");
            console.warn("    Building an auth file is documented here: https://www.digitalocean.com/community/tutorials/how-to-set-up-ssh-keys--2");
            console.warn("    Skipping the round trip jsonld through SPARQL service test!");
            done();
        } else { 

            // Check whether the endpoint (which is on the VPN) is accessible 
            // This test cannot be run if not on the VPN, so warn and move on if not.
            request.get({ uri: endpoint, timeout: 3000}, function(error, response, body) {

                if (!_.isEmpty(error)) { 
                    console.warn("    Unable to access the Allegrograph endpoint.  Are you on the VPN?");
                    console.warn("    The \"round trip jsonld through SPARQL service\" test requires VPN access to proceed.  Skipping this test.");
                    done();
                } else { 

                    return test.createNetwork({
                        insert: "rdf-components/rdf-clear-insert-jsonld",
                        construct: "rdf-components/rdf-construct-jsonld"
        
                    }).then(function(network){
        
                        network.graph.addInitial('rdf_auth_file', 'insert', 'auth_file_env');
                        network.graph.addInitial('rdf_auth_file', 'construct', 'auth_file_env');
                        network.graph.addInitial(endpoint, 'insert', 'sparql_endpoint');
                        network.graph.addInitial(endpoint, 'construct', 'sparql_endpoint');

                        return stubs.promiseLater().then(function(){
                            return new Promise(function(done) {
                                test.onOutPortData(network.processes.insert.component, 'output', done);
                                network.graph.addInitial("urn:test:graph", 'insert', 'target_graph_uri');
                                network.graph.addInitial(john, 'insert', 'parsed_jsonld');
                            });
                        }).then(stubs.promiseLater).then(function(){

                            return new Promise(function(done) {
                                test.onOutPortData(network.processes.construct.component, 'output', done);
                                network.graph.addInitial("urn:test:graph", 'construct', 'source_graph_uri');
                            }).then(function(roundtripResult) {
                                expect(roundtripResult.error).to.be.undefined;
                                roundtripResult.data.should.be.an('array');
                                roundtripResult.data.should.have.length(1);
                                roundtripResult.data.should.deep.equal([ 
                                    { '@id': 'http://dbpedia.org/resource/John_Lennon',
                                      'http://schema.org/spouse': { 
                                           '@id': 'http://dbpedia.org/resource/Cynthia_Lennon' 
                                      },
                                      'http://xmlns.com/foaf/0.1/name': 'John Lennon' } 
                                ]);
                                done();
                            });
                        });
                    });
                }
           });
       }
   });
});
