// jsonld-utils-mocha.js

var chai = require('chai');
var should = chai.should();
var expect = chai.expect;

var _ = require('underscore');
var fs = require('fs');

var jsonldUtils = require('../components/lib/jsonld-utils');
var logger = require('../src/logger');
var test = require('./common-test');

describe('jsonld-utils', function() {

    it("should exist as an object", function() {
        jsonldUtils.should.exist;
        jsonldUtils.should.be.an('object');
        jsonldUtils.getContext.should.be.a('function');
    });

    describe('#getContext', function() {

        it("should throw an error if no arguments specified", function(done) {
            return jsonldUtils.getContext().then(

                function(context) {
                    done(test.error("Expected a failure in getContext with no arguments test, but did not get one!"));
                },

                function(fail) {
                    // Expected path - verify we got the expected error
                    fail.toString().should.equal("getContext called with no data!");
                    done();

            }).catch(function(e) {
               done(test.error("Exception in jsonld-utils getContext API no data test!\n",e));
            });
        });

        it("should throw an error if no context found", function(done) {
            return jsonldUtils.getContext({"id": "abc", "type": "test"}).then(

                function(context) {
                    done(test.error("Expected a failure in jsonld-utils data with no context test, but did not get one!"));
                },

                function(fail) {
                    // Expected path - verify we got the expected error
                    fail.toString().should.equal("getContext called with no context!");
                    done();

            }).catch(function(e) {
               done(test.error("Exception in jsonld-utils getContext API gracefully when no context!\n",e));
            });
        });

        it("should throw an error if no graph found", function(done) {
            return jsonldUtils.getContext({"@context": { "@id": "id"}}).then(

                function(context) {
                    done(test.error("Expected a failure in jsonld-utils data with no graph test, but did not get one!"));
                },

                function(fail) {
                    // Expected path - verify we got the expected error
                    fail.toString().should.equal("getContext called with no data graph!");
                    done();

            }).catch(function(e) {
               done(test.error("Exception in jsonld-utils getContext API gracefully when no graph!\n",e));
            });
        });

        it("should retrieve an embedded context", function(done) {
            var context = { "id": "@id",
                            "type": "@type" };

            return jsonldUtils.getContext({"@context": context, 
                                           "@graph": [{
                                              "type": "cmumpss:Patient-2",
                                              "id": "2-000007",
                                              "label": "BUNNY,BUGS"
                                           }]
            }).then(

                function(result) {
                    result.should.equal(context);
                    done();
                },

                function(fail) {
                    done(test.error("jsonld-utils getContext API failed processing an embedded context: "+fail));

            }).catch(function(e) {
               done(test.error("Exception in jsonld-utils getContext API handling embedded context!\n",e));
            });
        });

        it("should retrieve the cmumps url context", function(done) {
            var context = "https://raw.githubusercontent.com/rdf-pipeline/translators/master/data/fake_cmumps/patient-7/context.jsonld";
            return jsonldUtils.getContext({"@context": context, 
                                           "@graph": [{
                                              "type": "cmumpss:Patient-2",
                                              "id": "2-000007",
                                              "label": "BUNNY,BUGS"
                                           }]
            }).then(

                function(result) {
                    result.should.deep.equal({ 
                        '@context': { loinc: 'http://hokukahu.com/schema/loinc#',
                                      hptc: 'http://hokukahu.com/schema/hptc#',
                                      cpt: 'http://hokukahu.com/schema/cpt#',
                                      ndc: 'http://hokukahu.com/schema/ndc#',
                                      icd9cm: 'http://hokukahu.com/schema/icd9cm#',
                                      npi: 'http://hokukahu.com/schema/npi#',
                                      nddf: 'http://hokukahu.com/schema/nddf#',
                                      '@vocab': 'http://hokukahu.com/schema/cmumpss#',
                                      cmumpss: 'http://hokukahu.com/schema/cmumpss#',
                                      xsd: 'http://www.w3.org/2001/XMLSchema#',
                                      '@base': 'http://hokukahu.com/systems/cmumps-1/',
                                      _id: '@id',
                                      id: '@id',
                                      type: '@type',
                                      list: '@list',
                                      value: '@value',
                                      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
                                      label: { '@id': 'rdfs:label' },
                                      owl: 'http://www.w3.org/2002/07/owl#',
                                      fms: 'http://datasets.caregraf.org/fms/',
                                      sameAs: { '@id': 'owl:sameAs', '@type': '@id' },
                                      sameAsLabel: { '@id': 'fms:sameAsLabel' } } 
                    });
                    done();
                },

                function(fail) {
                    done(test.error("jsonld-utils getContext API failed processing cmumps url context: "+fail));

            }).catch(function(e) {
               done(test.error("Exception in jsonld-utils getContext API handling cmumps url context!\n",e));
            });
        });

        it("should use default context if URL context is not available", function(done) {
            var context = "https://badContextURL.com/patient-7/context.jsonld";
            var defaultContext = { "id": "@id", "type": "@type" };

            logger.silence('error');
            return jsonldUtils.getContext({ "@context": context, 
                                            "@graph": [{
                                               "type": "cmumpss:Patient-2",
                                               "id": "2-000007",
                                               "label": "BUNNY,BUGS"
                                             }] 
                                           },
                                           defaultContext).then(

                function(result) {
                    logger.verbose('error');
                    result.should.equal(defaultContext);
                    done();
                },

                function(fail) {
                    logger.verbose('error');
                    done(test.error("jsonld-utils getContext API failed processing default context: "+fail));

            }).catch(function(e) {
               logger.verbose('error');
               done(test.error("Exception in jsonld-utils getContext API handling default context!\n",e));
            });
        });

        it("should fail if URL context is not available and no default is provided", function(done) {
            var context = "https://badContextURL.com/patient-7/context.jsonld";
            var defaultContext = { "id": "@id", "type": "@type" };

            logger.silence('error');
            return jsonldUtils.getContext({ "@context": context, 
                                            "@graph": [{
                                               "type": "cmumpss:Patient-2",
                                               "id": "2-000007",
                                               "label": "BUNNY,BUGS"
                                             }] 
                                           }).then( 

                function(result) {
                    logger.verbose('error');
                    done("Jsonld-utils getContext API should fail when URL context is not available and no default is provided!");
                },

                function(fail) {
                    // expected path - this should fail 
                    fail.should.contain("Unable to get context for https://badContextURL.com/patient-7/context.jsonld");
                    done();

            }).catch(function(e) {
               logger.verbose('error');
               done(test.error("Exception in jsonld-utils getContext API handling inaccessible context with no default context!\n",e));
            });
        });

        it("should fail if URL context is not JSON", function(done) {
            var context = "https://raw.githubusercontent.com/rdf-pipeline/noflo-rdf-components/master/test/common-test.js";
            var defaultContext = { "id": "@id", "type": "@type" };

            logger.silence('error');
            return jsonldUtils.getContext({ "@context": context, 
                                            "@graph": [{
                                               "type": "cmumpss:Patient-2",
                                               "id": "2-000007",
                                               "label": "BUNNY,BUGS"
                                             }] 
                                           }).then( 

                function(result) {
                    logger.verbose('error');
                    done("Jsonld-utils getContext API should fail when URL context is not JSON!");
                },

                function(fail) {
                    // expected path - this should fail 
                    fail.should.contain("GetContext API is unable to parse context");
                    done();

            }).catch(function(e) {
               logger.verbose('error');
               done(test.error("Exception in jsonld-utils getContext API handling non-JSON context!\n",e));
            });
        });

    }); 

    describe('#jsonldToNormalizedRdf', function() {

        it("should throw an error if no arguments specified", function(done) {
            return jsonldUtils.jsonldToNormalizedRdf().then(

                function(context) {
                    done(test.error("Expected a failure in jsonldToNormalizedRdf no arguments test, but did not get one!"));
                },

                function(fail) {
                    // Expected path - verify we got the expected error
                    fail.toString().should.equal("jsonldToNormalizedRdf called with no JSON data!");
                    done();

            }).catch(function(e) {
               done(test.error("Exception in jsonld-utils jsonldToNormalizedRdf API no data test!\n",e));
            });
        });

        it("should convert simple JSON-LD to normalized RDF", function(done) {

            var json = { 
                "@context": { 
                    "cmumpss": "http://hokukahu.com/schema/cmumpss#",
                    "xsd": "http://www.w3.org/2001/XMLSchema#",
                    "@base": "http://hokukahu.com/systems/cmumps-1/",
                    "id": "@id",
                    "type": "@type",
                    "value": "@value",
                    "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
                    "label": {
                        "@id": "rdfs:label"
                    }
                },
                "@graph": [
                   { "type": "cmumpss:Patient-2",
                     "id": "2-000007",
                     "label": "BUNNY,BUGS" } ] 
             };

            return jsonldUtils.jsonldToNormalizedRdf(json).then(
                function(result) {
                    result.should.equal(
                       '<http://hokukahu.com/systems/cmumps-1/2-000007> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://hokukahu.com/schema/cmumpss#Patient-2> .\n'+
                       '<http://hokukahu.com/systems/cmumps-1/2-000007> <http://www.w3.org/2000/01/rdf-schema#label> \"BUNNY,BUGS\" .\n');
                    done();
                }, 
                function(fail) {
                    done(test.error("jsonldToNormalizedRdf API is unable to process simple JSON-LD: " + fail));

            }).catch(function(e) {
               done(test.error("Exception in jsonld-utils jsonldToNormalizedRdf API converting simple JSON-LD to normalized RDF!\n",e));
            });

        });

        it("should convert patient-7 demographics to normalized RDF", function(done) {
           var demographics = JSON.parse(fs.readFileSync(__dirname + '/data/cmumps-patient7-demographics.jsonld','utf8'));
           var expected = fs.readFileSync(__dirname + '/data/cmumps-patient7-demographics.ttl','utf8');

            return jsonldUtils.jsonldToNormalizedRdf(demographics).then(
                function(result) {
                    expect(result.trim()).to.equal(expected.trim());
                    done();
                }, 
                function(fail) {
                    done(test.error("jsonldToNormalizedRdf API is unable to process simple JSON-LD: " + fail));

            }).catch(function(e) {
               done(test.error("Exception in jsonld-utils jsonldToNormalizedRdf API converting simple JSON-LD to normalized RDF!\n",e));
            });
           
        });
    }); 
});
