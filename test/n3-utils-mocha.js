// n3-utils-mocha.js

var _ = require("underscore");

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
chai.should();

var sinon = require("sinon");

var fs = require("fs");
var os = require("os");

var N3 = require("n3");

var n3Utils = require("../components/lib/n3-utils");

var logger = require("../src/logger");
var test = require("./common-test");

var demographics = JSON.parse(fs.readFileSync(__dirname + "/data/simple-patient7.jsonld"));
var frame = {
       "@context": "https://raw.githubusercontent.com/rdf-pipeline/translators/master/data/fake_cmumps/patient-7/context.jsonld"
};

describe("n3-utils", function() {

    it("should exist as an object", function() {
        n3Utils.should.exist;
        n3Utils.should.be.an("object");

        // verified expects API is there
        n3Utils.jsonldToN3.should.be.a("function");
        n3Utils.n3ToJsonld.should.be.a("function");
        n3Utils.n3ToTtl.should.be.a("function");
    });

    describe("#jsonldToN3", function() {

        it("should gracefully handle errors if bad JSON-LD data was given", function(done) {

            logger.silence('error');
            afterEach(_.once(logger.verbose.bind(logger, 'error')));
  
            var badJson = "A steaming pile of garbage";
            return n3Utils.jsonldToN3(badJson).then(

                function(store) {
                    done(test.error("Expected a failure in jsonldN3 bad JSON-LD data test, but did not get one!"));
                }, 

                function(fail) { 
                    // Expected path - verify we got the expected error
                    fail.toString().should.equal(
                        "Error: Unable to convert JSON-LD to N3: Could not expand input before serialization to RDF.");
                    done();

            }).catch(function(e) { 
               logger.verbose('error');
               done(test.error("Exception in jsonldToN3 API gracefully handle bad JSON-LD data test!\n",e));
            });
        });

        it("should create an empty N3 store if no json data was specified", function(done) {

           return n3Utils.jsonldToN3().then(
               function(store) {
                   store.should.be.an('object');

                   return new Promise(function(resolve) {  
                       resolve(store.find(null, null, null));

                   }).then(
                       function(triples) { 
                           triples.should.be.empty;
                           done();
                   });

            }).catch(function(e) {
                done(test.error("Exception in jsonldToN3 API empty store test!\n", e));
            });
        });

        it("should create an N3 store from JSON data", function(done) {

            return n3Utils.jsonldToN3(demographics).then(
                function(store) {
                    store.should.be.an('object');

                    return new Promise(function(resolve) {  
                        resolve(store.find(null, null, null));

                    }).then(
                        function(triples) { 
                            triples.should.be.an('array');
                            triples.should.have.length(20);

                            var subjects = _.pluck(triples, 'subject');
                            subjects.should.have.length(20);
                            subjects.should.contain('_:b0');
                            subjects.should.contain('_:b1');
                            subjects.should.contain('_:b2');

                            var predicates = _.pluck(triples, 'predicate');
                            predicates.should.deep.equal([ 
                                'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
                                'http://hokukahu.com/schema/cmumpss#city-2',
                                'http://hokukahu.com/schema/cmumpss#dob-2',
                                'http://hokukahu.com/schema/cmumpss#ecity-2',
                                'http://hokukahu.com/schema/cmumpss#emergency_contact-2',
                                'http://hokukahu.com/schema/cmumpss#ephone-2',
                                'http://hokukahu.com/schema/cmumpss#erelationship-2',
                                'http://hokukahu.com/schema/cmumpss#estreet_address-2',
                                'http://hokukahu.com/schema/cmumpss#ezip-2',
                                'http://hokukahu.com/schema/cmumpss#fmp-2',
                                'http://hokukahu.com/schema/cmumpss#identifier',
                                'http://hokukahu.com/schema/cmumpss#phone-2',
                                'http://hokukahu.com/schema/cmumpss#state-2',
                                'http://hokukahu.com/schema/cmumpss#street_address-2',
                                'http://hokukahu.com/schema/cmumpss#zip_code-2',
                                'http://www.w3.org/2000/01/rdf-schema#label',
                                'http://hokukahu.com/schema/cmumpss#identifier',
                                'http://www.w3.org/2000/01/rdf-schema#label',
                                'http://hokukahu.com/schema/cmumpss#identifier',
                                'http://www.w3.org/2000/01/rdf-schema#label' ]);

                            var objects = _.pluck(triples, 'object');
                            objects.should.deep.equal([ 
                                'http://hokukahu.com/schema/cmumpss#Patient-2',
                                '"ANYTOWN"^^http://www.w3.org/2001/XMLSchema#string',
                                '"1990-01-01"^^http://www.w3.org/2001/XMLSchema#date',
                                '"ALBUQUERQUE"^^http://www.w3.org/2001/XMLSchema#string',
                                '"RUNNAH, ROAD"^^http://www.w3.org/2001/XMLSchema#string',
                                '"555 555 5558"^^http://www.w3.org/2001/XMLSchema#string',
                                '_:b1',
                                '"7000 InternalTest Boulevard"^^http://www.w3.org/2001/XMLSchema#string',
                                '"55555"^^http://www.w3.org/2001/XMLSchema#string',
                                '_:b2',
                                '"2-000007"^^http://www.w3.org/2001/XMLSchema#string',
                                '"555 555 5555"^^http://www.w3.org/2001/XMLSchema#string',
                                '"NEW YORK"^^http://www.w3.org/2001/XMLSchema#string',
                                '"100 MAIN ST"^^http://www.w3.org/2001/XMLSchema#string',
                                '"60040"^^http://www.w3.org/2001/XMLSchema#string',
                                '"BUNNY,BUGS"^^http://www.w3.org/2001/XMLSchema#string',
                                '"8140-20"^^http://www.w3.org/2001/XMLSchema#string',
                                '"OTHER RELATIONSHIP"^^http://www.w3.org/2001/XMLSchema#string',
                                '"8110-20"^^http://www.w3.org/2001/XMLSchema#string',
                                '"20"^^http://www.w3.org/2001/XMLSchema#string' ]); 

                            var graphs = _.uniq(_.pluck(triples, 'graph'));
                            graphs.should.deep.equal([ '' ]);

                            done();
                        });

            }).catch(function(e) { 
                done(test.error("Exception in jsonldToN3 API create an N3 store from JSON data test!\n", e));
            });
        });
    });

    describe("#n3ToTtl", function() {

        it("should throw an error if given a missing N3 store", function() {
            logger.silence('error');
            afterEach(_.once(logger.verbose.bind(logger, 'error')));
            return n3Utils.n3ToTtl().should.eventually.be.rejectedWith("n3ToTtl called with an empty N3 store!");
        });

        it("should gracefully handle an empty N3 store", function(done) {

            // Create an empty N3 store by passing in no JSON-LD to load
            return n3Utils.jsonldToN3().then(
                function(store) {
                    store.should.be.an('object');

                    return new Promise(function(resolve) {  
                        resolve(n3Utils.n3ToTtl(store));

                    }).then(

                        function(ttl) { 
                            ttl.should.be.a('string');
                            ttl.should.be.empty;
                            done();
                    });

            }).catch(function(e) { 
                done(test.error("Exception in n3ToTtl API empty N3 store test!\n", e));
            });
        });

        it("should convert an N3 store to turtle", function(done) {

            n3Utils.jsonldToN3(demographics).then(
                function(store) {
                    store.should.be.an('object');

                    return new Promise(function(resolve) {  
                        resolve(n3Utils.n3ToTtl(store));

                    }).then(

                        function(ttl) { 
                            verifyDemographicsTtl(ttl);
                            done();
                    });

            }).catch(function(e) { 
                done(test.error("Exception n3ToTtl API convert N3 to Turtle test!\n", e));
            });
        });

        it("should convert an N3 store to turtle and write to the specified file", function(done) {

            var filename = os.tmpdir() + '/n3-ttl-test.ttl';
            n3Utils.jsonldToN3(demographics).then(
                function(store) {
                    store.should.be.an('object');

                    return new Promise(function(resolve) {  
                        resolve(n3Utils.n3ToTtl(store, filename));

                    }).then(
    
                        function(ttl) { 
                            ttl.should.not.be.empty;
                            verifyDemographicsTtl(ttl);
                            var string = fs.readFileSync(filename, 'utf-8');
                            ttl.should.equal(string);
                            fs.unlinkSync(filename);
                            done();

                    });

            }).catch(function(e) { 
                done(test.error("Exception in n3ToTtl API convert N3 store to Turtle and write to file test!\n", e));
            });
        });

        it("should gracefully handle the error when the specified file cannot be written", function(done) {

            // generate a file name with a path does not exist
            var filename = os.tmpdir() + '/' + Math.random() + '/' + Math.random() + '/n3-test.ttl';

            return n3Utils.jsonldToN3(demographics).then(
                function(store) {
                    store.should.be.an('object');

                    logger.silence('error');
                    afterEach(_.once(logger.verbose.bind(logger, 'error')));

                    return new Promise(function(resolve, reject) {  
                        resolve(n3Utils.n3ToTtl(store, filename));

                    }).then(
 
                        function(ttl) { 
                            done(test.error("File write of " + filename + " should have failed!"));
                        }, 
 
                       function(fail) { 
                           // Expect the above call to n3ToTtl to fail - this is the normal path 
                           fail.message.should.contain("Unable to convert N3 store to TTL!");
                           done();
                    });

            }).catch(function(e) { 
                logger.verbose('error');
                done(test.error("Exception in n3ToTtl API error writing to a file test!\n", e));
            });
        });
    });

    describe("#n3ToTtlToJsonld", function() {

        it("should throw an error if given a missing N3 store", function() {
            logger.silence('error');
            afterEach(_.once(logger.verbose.bind(logger, 'error')));

            return n3Utils.n3ToTtlToJsonld().should.eventually.be.rejectedWith(
                "n3ToTtlToJsonld error converting N3 store to TTL!");
        });
 
        it("should gracefully handle an empty N3 store", function(done) {

            // Create an empty N3 store by passing in no JSON-LD to load
            return n3Utils.jsonldToN3().then(
                function(store) {
                    store.should.be.an('object');

                    logger.silence('error');
                    afterEach(_.once(logger.verbose.bind(logger, 'error')));

                    return new Promise(function(resolve) {
                        resolve(n3Utils.n3ToTtlToJsonld(store));

                    }).then(

                        function(jsonld) {
                            done(test.error("n3ToTtlToJsonld API should give an error if given no data to convert!"));
                        }, 

                        function(fail) { 
                            // Expect the above call to n3ToTtlToJsonld to fail - this is the normal path 
                            fail.message.should.contain("n3ToTtlToJsonld API received no content to convert to JSON-LD!");
                            done();
                        })

            }).catch(function(e) {
                logger.verbose('error');
                done(test.error("Exception in n3ToTtlToJsonld empty N3 store test!\n", e));
            });
        });

        it("should convert an N3 store to TTL and then to JSON-LD", function(done) {

            n3Utils.jsonldToN3(demographics).then(
                function(store) { 

                    store.should.be.an('object');

                    return new Promise(function(resolve) {
                        resolve(n3Utils.n3ToTtlToJsonld(store));

                    }).then(

                        function(json) { 
                            verifyDemographicsJson(json);  
                            done();
                    });

            }).catch(function(e) {
                done(test.error("Exception in n3ToTtlToJsonld N3 to TTL to JSON-LD test!\n", e));
            }); 

        });

        it("should convert an N3 store to TTL and then to framed JSON-LD", function(done) {

            n3Utils.jsonldToN3(demographics).then(
                function(store) { 

                    store.should.be.an('object');

                    return new Promise(function(resolve) {
                        resolve(n3Utils.n3ToTtlToJsonld(store, frame));

                    }).then(

                        function(json) { 
                            verifyDemographicsFramedJson(json);  
                            done();
                    });

            }).catch(function(e) {
                done(test.error("Exception in n3ToTtlToJsonld framed JSON-LD test!\n", e));
            }); 
        });

        it("should convert an N3 store to TTL, then to JSON-LD, and finally write to the specified file", function(done) {

            var filename = os.tmpdir() + '/n3-ttl-jsonld-test.jsonld';
            n3Utils.jsonldToN3(demographics).then(
                function(store) { 
                    store.should.be.an('object');

                    return new Promise(function(resolve) {
                        resolve(n3Utils.n3ToTtlToJsonld(store, undefined, filename));

                    }).then(

                        function(json) { 
                            verifyDemographicsJson(json);  
                            var string = fs.readFileSync(filename, 'utf-8');
                            string.should.equal(JSON.stringify(json, null, 2));
                            fs.unlinkSync(filename);
                            done();
                    });

            }).catch(function(e) {
                done(test.error("Exception n3ToTtlToJsonld file write test!\n", e));
            }); 
        });

        it("should gracefully handle the error when the specified file cannot be written", function(done) {

            var filename = os.tmpdir() + '/' + Math.random() + '/' + Math.random() + '/n3-ttl-jsonld-test.jsonld';
            n3Utils.jsonldToN3(demographics).then(
                function(store) { 
                    store.should.be.an('object');

                    logger.silence('error');
                    afterEach(_.once(logger.verbose.bind(logger, 'error')));

                    return new Promise(function(resolve) {
                        resolve(n3Utils.n3ToTtlToJsonld(store, undefined, filename));

                    }).then(

                        function(json) { 
                            done(Error("File write of " + filename + " should have failed!"));
                        }, 

                        function(fail) { 
                            // Expect the above call to n3ToTtlToJsonld to fail - this is the normal path 
                            fail.message.should.contain("n3ToTtlToJsonld API was unable to write file");
                            done();
                    });

            }).catch(function(e) {
                logger.verbose('error');
                done(test.error("Exception n3ToTtlToJsonld file write error handling test!\n", e));
            }); 
        });
    });

    describe("#n3ToJsonld", function() {
        it("should throw an error if given a missing N3 store", function() {
            logger.silence('error');
            afterEach(_.once(logger.verbose.bind(logger, 'error')));

            return n3Utils.n3ToJsonld().should.eventually.be.rejectedWith(
                "n3ToJsonld API requires an N3 store!");
        });

        it("should throw an error if given a missing frame", function() {
            logger.silence('error');
            afterEach(_.once(logger.verbose.bind(logger, 'error')));

            return n3Utils.n3ToJsonld(N3.Store()).should.eventually.be.rejectedWith(
                "n3ToJsonld API requires a frame!");
        });

        it("should gracefully handle an empty N3 store", function() {
            return n3Utils.n3ToJsonld(N3.Store(), frame).should.eventually.be.empty;
        });

        it("should gracefully handle a bad frame", function(done) {
            logger.silence('error');
            afterEach(_.once(logger.verbose.bind(logger, 'error')));

            return new Promise(function(resolve) {
                resolve(n3Utils.jsonldToN3(demographics));

            }).then(
                function(store) {
                    store.should.be.an('object');

                    return new Promise(function(resolve, reject) { 
                        var badFrame = { "@context": 'http://url-to-la-la-land'};
                        resolve(n3Utils.n3ToJsonld(store, badFrame)); 
                    }).then( 

                        function(json) { 
                            done(Error("n3ToJsonld should fail with a bad frame, but did not!"));
                        }, 

                        function(fail) { 
                            // Expect the above call to n3ToJsonld to fail - this is the normal path 
                            fail.message.should.contain("n3ToJsonld API was unable to frame JSON!");
                            done();

                    }).catch(function(e) { 
                        logger.verbose('error');
                        done(test.error("Exception n3ToJsonld in handle bad frame test!\n", e));
                    });
            });
        });

        it("should convert an N3 store to framed JSON-LD", function(done) {
            return new Promise(function(resolve) {
                resolve(n3Utils.jsonldToN3(demographics));

            }).then(
                function(store) {
                    store.should.be.an('object');

                    return new Promise(function(resolve) {
                        resolve(n3Utils.n3ToJsonld(store, frame));

                    }).then( function(json) {
                        verifyDemographicsFramedJson(json);  
                        done();
                    });

            }).catch(function(e) {
                done(test.error("Exception in n3ToJsonld API convert N3 store to JSON-LD test!", e));
            });
        });

        it("should convert an N3 store to JSON-LD, and finally write to the specified file", function(done) {

            var filename = os.tmpdir() + '/n3-jsonld-test.jsonld';
            n3Utils.jsonldToN3(demographics).then(
                function(store) { 
                    store.should.be.an('object');

                    return new Promise(function(resolve) {
                        resolve(n3Utils.n3ToJsonld(store, frame, filename));

                    }).then( function(json) {
                        verifyDemographicsFramedJson(json);
                        var string = fs.readFileSync(filename, 'utf-8');
                        string.should.equal(JSON.stringify(json, null, 2));
                        fs.unlinkSync(filename);
                        done();
                    });

            }).catch(function(e) {
                done(test.error("Exception in n3ToJsonld API convert N3 store to JSON-LD test!", e));
            });
        });

        it("should gracefully handle the error when the specified file cannot be written", function(done) {

            var filename = os.tmpdir() + '/' + Math.random() + '/' + Math.random() + '/n3-jsonld-test.jsonld';
            n3Utils.jsonldToN3(demographics).then(
                function(store) { 
                    store.should.be.an('object');

                    logger.silence('error');
                    afterEach(_.once(logger.verbose.bind(logger, 'error')));

                    return new Promise(function(resolve) {
                        resolve(n3Utils.n3ToJsonld(store, frame, filename));

                    }).then(

                        function(json) { 
                            done(Error("File write of " + filename + " should have failed!"));
                        }, 

                        function(fail) { 
                            // Expect the above call to n3ToJsonld to fail - this is the normal path 
                            fail.message.should.contain("n3ToJsonld API was unable to write file");
                            done();
                    });

            }).catch(function(e) {
                logger.verbose('error');
                done(test.error("Exception n3ToJsonld file write error handling test!\n", e));
            }); 
        });

    });
});

function verifyDemographicsJson(json) { 
    json.should.deep.equal([ 
        { '@type': [ 'http://hokukahu.com/schema/cmumpss#Patient-2' ],
          'http://hokukahu.com/schema/cmumpss#city-2': 'ANYTOWN',
          'http://hokukahu.com/schema/cmumpss#dob-2': 
                 { '@type': 'http://www.w3.org/2001/XMLSchema#date',
                   '@value': '1990-01-01' },
          'http://hokukahu.com/schema/cmumpss#ecity-2': 'ALBUQUERQUE',
          'http://hokukahu.com/schema/cmumpss#emergency_contact-2': 'RUNNAH, ROAD',
          'http://hokukahu.com/schema/cmumpss#ephone-2': '555 555 5558',
          'http://hokukahu.com/schema/cmumpss#erelationship-2': { '@id': '_:15' },
          'http://hokukahu.com/schema/cmumpss#estreet_address-2': '7000 InternalTest Boulevard',
          'http://hokukahu.com/schema/cmumpss#ezip-2': '55555',
          'http://hokukahu.com/schema/cmumpss#fmp-2': { '@id': '_:21' },
          'http://hokukahu.com/schema/cmumpss#identifier': '2-000007',
          'http://hokukahu.com/schema/cmumpss#phone-2': '555 555 5555',
          'http://hokukahu.com/schema/cmumpss#state-2': 'NEW YORK',
          'http://hokukahu.com/schema/cmumpss#street_address-2': '100 MAIN ST',
          'http://hokukahu.com/schema/cmumpss#zip_code-2': '60040',
          'http://www.w3.org/2000/01/rdf-schema#label': 'BUNNY,BUGS' 
        },
        { '@id': '_:15',
          'http://hokukahu.com/schema/cmumpss#identifier': '8140-20',
          'http://www.w3.org/2000/01/rdf-schema#label': 'OTHER RELATIONSHIP' },
        { '@id': '_:21',
          'http://hokukahu.com/schema/cmumpss#identifier': '8110-20',
          'http://www.w3.org/2000/01/rdf-schema#label': '20' } 
    ]);
}

function verifyDemographicsFramedJson(json) { 
    json.should.deep.equal({
        "@context": "https://raw.githubusercontent.com/rdf-pipeline/translators/master/data/fake_cmumps/patient-7/context.jsonld",
        "@graph": [
             { "type": "Patient-2",
               "city-2": "ANYTOWN",
               "dob-2": {
                 "type": "xsd:date",
                 "value": "1990-01-01"
               },
               "ecity-2": "ALBUQUERQUE",
               "emergency_contact-2": "RUNNAH, ROAD",
               "ephone-2": "555 555 5558",
               "erelationship-2": {
                 "identifier": "8140-20",
                 "label": "OTHER RELATIONSHIP"
               },
               "estreet_address-2": "7000 InternalTest Boulevard",
               "ezip-2": "55555",
               "fmp-2": {
                 "identifier": "8110-20",
                 "label": "20"
               },
               "identifier": "2-000007",
               "phone-2": "555 555 5555",
               "state-2": "NEW YORK",
               "street_address-2": "100 MAIN ST",
               "zip_code-2": "60040",
               "label": "BUNNY,BUGS"
             }
        ]
    });
}

function verifyDemographicsTtl(ttl) { 
    ttl.should.equal('_:b0 a <http://hokukahu.com/schema/cmumpss#Patient-2>;\n' +
        '    <http://hokukahu.com/schema/cmumpss#city-2> "ANYTOWN"^^<http://www.w3.org/2001/XMLSchema#string>;\n' + 
        '    <http://hokukahu.com/schema/cmumpss#dob-2> "1990-01-01"^^<http://www.w3.org/2001/XMLSchema#date>;\n' + 
        '    <http://hokukahu.com/schema/cmumpss#ecity-2> "ALBUQUERQUE"^^<http://www.w3.org/2001/XMLSchema#string>;\n' + 
        '    <http://hokukahu.com/schema/cmumpss#emergency_contact-2> "RUNNAH, ROAD"^^<http://www.w3.org/2001/XMLSchema#string>;\n' + 
        '    <http://hokukahu.com/schema/cmumpss#ephone-2> "555 555 5558"^^<http://www.w3.org/2001/XMLSchema#string>;\n' + 
        '    <http://hokukahu.com/schema/cmumpss#erelationship-2> _:b1;\n' + 
        '    <http://hokukahu.com/schema/cmumpss#estreet_address-2> "7000 InternalTest Boulevard"^^<http://www.w3.org/2001/XMLSchema#string>;\n' + 
        '    <http://hokukahu.com/schema/cmumpss#ezip-2> "55555"^^<http://www.w3.org/2001/XMLSchema#string>;\n' + 
        '    <http://hokukahu.com/schema/cmumpss#fmp-2> _:b2;\n' + 
        '    <http://hokukahu.com/schema/cmumpss#identifier> "2-000007"^^<http://www.w3.org/2001/XMLSchema#string>;\n' + 
        '    <http://hokukahu.com/schema/cmumpss#phone-2> "555 555 5555"^^<http://www.w3.org/2001/XMLSchema#string>;\n' + 
        '    <http://hokukahu.com/schema/cmumpss#state-2> "NEW YORK"^^<http://www.w3.org/2001/XMLSchema#string>;\n' + 
        '    <http://hokukahu.com/schema/cmumpss#street_address-2> "100 MAIN ST"^^<http://www.w3.org/2001/XMLSchema#string>;\n' + 
        '    <http://hokukahu.com/schema/cmumpss#zip_code-2> "60040"^^<http://www.w3.org/2001/XMLSchema#string>;\n' + 
        '    <http://www.w3.org/2000/01/rdf-schema#label> "BUNNY,BUGS"^^<http://www.w3.org/2001/XMLSchema#string>.\n' +
        '_:b1 <http://hokukahu.com/schema/cmumpss#identifier> "8140-20"^^<http://www.w3.org/2001/XMLSchema#string>;\n' + 
        '    <http://www.w3.org/2000/01/rdf-schema#label> "OTHER RELATIONSHIP"^^<http://www.w3.org/2001/XMLSchema#string>.\n' + 
        '_:b2 <http://hokukahu.com/schema/cmumpss#identifier> "8110-20"^^<http://www.w3.org/2001/XMLSchema#string>;\n' + 
        '    <http://www.w3.org/2000/01/rdf-schema#label> "20"^^<http://www.w3.org/2001/XMLSchema#string>.\n'
    );
}
