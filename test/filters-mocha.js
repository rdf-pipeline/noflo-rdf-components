// filters-mocha.js

var _ = require('underscore');

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var fs = require('fs');
var util = require('util');

var filters = require('../components/lib/filters');
var logger = require('../src/logger');
var test = require('./common-test');

var jsonData = JSON.parse(fs.readFileSync(__dirname + '/data/cmumps-patient7.jsonld','utf8'));

describe('filters', function() {

    it('should exist as an object', function() {
        filters.should.exist;
        filters.should.be.an('object');

        // verified expects API is there
        filters.filterByAttributes.should.be.a('function');
        filters.filterByLiterals.should.be.a('function');
        filters.filterByJsonPointers.should.be.a('function');
    });

    describe('#filterByAttributes', function() {
        it('should throw an error if no json data was specified', function() {
            logger.silence('error');
            expect(filters.filterByAttributes.bind(this, undefined)).to.throw(Error,
                /Filter by attributes API requires JSON data to parse!/);
            logger.verbose('error');
        });

        it('should throw an error if json data was empty', function() {
            logger.silence('error');
            expect(filters.filterByAttributes.bind(this, '')).to.throw(Error,
                /Filter by attributes API requires JSON data to parse!/);
            logger.verbose('error');
        });

        it('should throw an error if filter is not an array', function() {
            logger.silence('error');
            expect(filters.filterByAttributes.bind(this, [{"alpha": "beta"}], {"alpha": "beta"})).to.throw(Error,
                /Filter by attributes API expects an array of attributes to be matched!/);
            logger.verbose('error');
        });

        it('should throw an error if filter was empty', function() {
            logger.silence('error');
            expect(filters.filterByAttributes.bind(this, [{"alpha": "beta"}], {})).to.throw(Error,
                /Filter by attributes API requires filter JSON data to parse!/);
            logger.verbose('error');
        });

        it('should filter a JSON data for a single match', function() {
            var data = '[ {"alpha": "beta"}, {"gamma": "delta"} ]';
            var filter = '[ {"alpha": "beta"} ]';
            
            logger.silence('error');
            expect(filters.filterByAttributes.call(this, data, filter)).to.deep.equal([{alpha: "beta"}]);
            logger.verbose('error');
        });

        it('should filter a JSON data for with multiple matches', function() {
            var data = [ {"alpha": "beta", "gamma": "delta"}, 
                         {"gamma": "delta", "epsilon": "zeta"},
                         {"eta": "theta", "iota": "kappa"} ];
            var filter = [ {"gamma": "delta"} ];
            
            expect(filters.filterByAttributes.call(this, data, filter)).to.deep.equal(
                [{alpha: "beta", "gamma": "delta"}, {"gamma": "delta", "epsilon": "zeta"}]);
        });

        it('should filter nested JSON data attribute/value matches', function() {
            var data = [ {"alpha": "beta", 
                          "epsilon": {"gamma": "delta"}},  // no match
                         {"gamma": "delta",    // this one should match
                          "epsilon": {"zeta": "eta"}},
                         {"gamma": "theta", 
                          "delta": "gamma"} ];
            var filter = [ {"gamma": "delta"} ];
            
            expect(filters.filterByAttributes.call(this, data, filter)).to.deep.equal(
                         [{"gamma": "delta", "epsilon": {"zeta": "eta"}}]);
        });

        it('should filter with multiple filter attribute criteria', function() {
            var data = [ {"alpha": "beta", "gamma": "delta"},  // should match this one
                         {"gamma": "delta", "epsilon": "zeta"},
                         {"eta": "theta", "iota": "kappa"} ];
            var filter = [ {"alpha": "beta", "gamma": "delta"} ];
            
            expect(filters.filterByAttributes.call(this, data, filter)).to.deep.equal(
                [{alpha: "beta", "gamma": "delta"}]);
        });

        it('should filter with multiple filters', function() {
            var data = [ {"alpha": "beta", "gamma": "delta"},  // should match this one
                         {"gamma": "delta", "epsilon": "zeta"},
                         {"eta": "theta", "iota": "kappa"} ];
            var filter = [ {"alpha": "beta"}, {"iota": "kappa"} ];
            
            expect(filters.filterByAttributes.call(this, data, filter)).to.deep.equal(
                [{"alpha": "beta", "gamma": "delta"}, 
                 {"eta": "theta", "iota": "kappa"}]);
        });

        it('should filter by attribute starting from a jsonpointer', function() {
            var data = { 
                "alpha": {
                     "delta": [ 
                         {"epsilon": "zeta"}, 
                         {"eta": "theta"}, 
                         {"iota": "zeta",
                          "chi": "rho"}
                     ] 
                 },
                "beta": {
                     "kappa": [ 
                          {"lambda": "mu"}, 
                          {"xi": "omicron"}
                     ]
                }, 
                "iota": "zeta",
                "gamma":  {
                     "iota": {
                         "zeta": {
                              "tau": "upsilon" 
                         }
                     }
                },
                "kappa": {
                     "mu": [{
                          "iota": {
                               "theta" : "chi",
                               "zeta": "lambda"
                          }
                     }] 
                }
            };
            var filter = [{"iota": "zeta"}];
            
            expect(filters.filterByAttributes.call(this, data, filter, "/alpha/delta")).to.deep.equal(
                [{"iota": "zeta", "chi": "rho"}]);
        });
    });

    describe('#filterByLiterals', function() {

        it('should throw an error if no json data was specified', function() {
            logger.silence('error');
            expect(filters.filterByLiterals.bind(this, undefined)).to.throw(Error,
                /Filter by literals API requires JSON data to parse!/);
            logger.verbose('error');
        });

        it('should throw an error if json data was empty', function() {
            logger.silence('error');
            expect(filters.filterByLiterals.bind(this, '')).to.throw(Error,
                /Filter by literals API requires JSON data to parse!/);
            logger.verbose('error');
        });

        it('should throw an error if JSON data is not an array', function() {
            logger.silence('error');
            expect(filters.filterByLiterals.bind(this, {"alpha":"beta"}, ["alpha"])).to.throw(Error,
                /Filter by literals API expects an array of JSON data to filter/);
            logger.verbose('error');
        });

        it('should throw an error if filter was empty', function() {
            logger.silence('error');
            expect(filters.filterByLiterals.bind(this, ["alpha", "beta"], [])).to.throw(Error,
                /Filter by literals API requires filter JSON data to parse!/);
            logger.verbose('error');
        });

        it('should throw an error if filters is not an array', function() {
            logger.silence('error');
            expect(filters.filterByLiterals.bind(this, ["alpha", "beta"], {"alpha":"beta"})).to.throw(Error,
                /Filter by literals API expects an array of literal filters, i.e., array of strings, numbers, and booleans/);
            logger.verbose('error');
        });

        it('should gracefully handle case where everything is filtered out', function() {
            var data = [ "alpha", "beta", "gamma", "delta", "epsilon" ];
            var filter = [ "iota", "omega" ];
            
            expect(filters.filterByLiterals.call(this, data, filter)).to.be.empty;
        });

        it('should filter a JSON data array of strings', function() {
            var data = [ "alpha", "beta", "gamma", "delta", "epsilon" ];
            var filter = [ "alpha", "gamma" ];
            
            expect(filters.filterByLiterals.call(this, data, filter)).to.deep.equal(["alpha", "gamma"]);
        });

        it('should filter a string containing a JSON data array of strings', function() {
            var data = '[ "alpha", "beta", "gamma", "delta", "epsilon" ]';
            var filter = '[ "alpha", "gamma" ]';
            
            expect(filters.filterByLiterals.call(this, data, filter)).to.deep.equal(["alpha", "gamma"]);
        });

        it('should filter an array starting from a jsonpointer', function() {
            var data = {
                "alpha": ["delta", "epsilon", "zeta", "eta", "theta", "iota", "zeta"],
                "beta": ["kappa","lambda", "mu", "xi", "omicron", "ro"],
                "gamma": ["tau", "upsilon", "phi"]
            };
            var filter = ["kappa", "mu"];
            
            expect(filters.filterByLiterals.call(this, data, filter, "/beta")).to.deep.equal(["kappa", "mu" ]);
        });
    });

    describe('#filterByJsonPointers', function() {
        it('should throw an error if no json data was specified', function() {
            logger.silence('error');
            expect(filters.filterByJsonPointers.bind(this, undefined)).to.throw(Error,
                /Filter by JSON pointers API requires JSON data to parse!/);
            logger.verbose('error');
        });

        it('should throw an error if json data was empty', function() {
            logger.silence('error');
            expect(filters.filterByJsonPointers.bind(this, '')).to.throw(Error,
                /Filter by JSON pointers API requires JSON data to parse!/);
            logger.verbose('error');
        });

        it('should throw an error if JSON data is not an array', function() {
            logger.silence('error');
            expect(filters.filterByJsonPointers.bind(this, 
                                                     {"alpha":"beta"}, 
                                                     [{jsonpointer: "/alpha", value: "beta"}]))
                .to.throw(Error,
                   /Filter by JSON pointers API expects an array of JSON data to filter!/);
            logger.verbose('error');
        });

        it('should throw an error if filters was empty', function() {
            logger.silence('error');
            expect(filters.filterByJsonPointers.bind(this, [{"alpha": "beta"}], [])).to.throw(Error,
                /Filter by JSON pointers API requires filter JSON data to parse!/);
            logger.verbose('error');
        });

        it('should throw an error if filters is not an array', function() {
            logger.silence('error');
            expect(filters.filterByJsonPointers.bind(this, [{"alpha": "beta"}], {"alpha":"beta"})).to.throw(Error,
                "Filter by JSON pointers API expects an array of format [{jsonpointer: <pointer>, value: <value>}]!");
            logger.verbose('error');
        });

        it('should gracefully handle case where everything is filtered out', function() {
            var data = [ {"alpha": "beta"}, {"gamma": "delta"} ];
            var filter = [ {jsonpointer: "iota", value: "epsilon"} ];
            
            expect(filters.filterByJsonPointers.call(this, data, filter)).to.be.empty;
        });

        it('should filter a simple JSON data array of name/value pairs', function() {
            var data = [ {"alpha": "beta"}, {"gamma": "delta"} ];
            var filter = [ {jsonpointer: "/alpha", value: "beta"} ];
            
            // expect(
            filters.filterByJsonPointers.call(this, data, filter); // ).to.deep.equal(["alpha", "beta"]);
        });

        it('should filter a JSON data array of hashes with one key per hash', function() {
            var data = [
                {"alpha": {"beta": "gamma"}},
                {"delta": {"epsilon": "zeta"}},
                {"eta": {"theta": "iota"}}
            ];
            var filter = [{jsonpointer: "/alpha/beta", value: "gamma"},
                          {jsonpointer: "/eta/theta", value: "iota"} ];

            expect(filters.filterByJsonPointers.call(this, data, filter)).to.deep.equal(
                [{ alpha: { beta: 'gamma' } },
                 { eta: { theta: 'iota' } } ]);
        });

        it('should filter nested JSON data', function() {
            var data = [
                  { "alpha": { "beta": "gamma" },
                    "delta": { "epsilon": "zeta" }},
                  { "eta": { "theta": "iota" },
                    "iota": { "kappa": "lambda"}}
            ];
            var filter = [{jsonpointer: "/iota/kappa", value: "lambda"} ];

            expect(filters.filterByJsonPointers.call(this, data, filter)).to.deep.equal(
                [{ "eta": { "theta": "iota" },
                   "iota": { "kappa": "lambda"}}]);
        });

        it('should filter an array starting from a jsonpointer', function() {
            var data = [
                {"alpha": [
                    {"delta": {"epsilon": "zeta"}},
                    {"eta": {"theta": "iota"}}
                ]},
                {"beta": [
                    {"kappa": {"lambda": "mu"}},
                    {"xi": {"omicron": "ro"}}
                ]},
                {"gamma": [
                    {"tau": {"upsilon": "phi"}},
                    {"chi": {"psi": "omega"}}
                ]}
            ];

            var filter = [{jsonpointer: "/kappa/lambda", value: "mu"}];

            expect(filters.filterByJsonPointers.call(this, data, filter, "/1/beta")).to.deep.equal([{"kappa": { "lambda": "mu" }}]);
        });

        it('should work with multiple jsonpointer filters', function() {
            var data = [
                {id: "alpha",
                 type: "epsilon",
                 eta: {"theta": "iota"}
                },
                {id: "beta",
                 type: "lambda",
                 xi: {"omicron": "ro"}
                },
                {id: "gamma",
                 type: "tau",
                 "chi": {"psi": "omega"}
                },
                {id: "delta",
                 type: "epsilon",
                 eta: {"mu": "nu"}
                }
            ];

            var filter = [{jsonpointer: "/type", value: "epsilon"},
                          {jsonpointer: "/type", value: "tau"}];

            expect(filters.filterByJsonPointers.call(this, data, filter)).to.deep.equal(
                [ { id: 'alpha', type: 'epsilon', eta: { theta: 'iota' } },
                  { id: 'gamma', type: 'tau', chi: { psi: 'omega' } },
                  { id: 'delta', type: 'epsilon', eta: { mu: 'nu' } } ]
            );
        });

        it('should extract demographics from CMUMPS', function() {
            var cmumpsType = "cmumpss:Patient-2";
            var filter = [{jsonpointer: "/type", value: cmumpsType}];
            var demographics = filters.filterByJsonPointers.call(this, jsonData, filter, '/@graph');

            demographics.should.be.an('array');
            demographics.should.have.length(1);

            demographics[0].should.be.an('object');
            Object.keys(demographics[0]).should.have.length(48);

            demographics[0]._id.should.equal('2-000007');
            demographics[0].type.should.equal(cmumpsType);
            demographics[0]['sex-2'].should.deep.equal({ id: 'cmumpss:2__02_E-MALE', label: 'MALE' });
            demographics[0]['organ_donor-2'].should.deep.equal({ id: 'cmumpss:2_9001_01_E-UNDECIDED', label: 'UNDECIDED' });
        });

        it('should extract diagnoses from CMUMPS', function() {
            var cmumpsType = "cmumpss:Kg_Patient_Diagnosis-100417";
            var filter = [{jsonpointer: "/type", value: cmumpsType}];
            var diagnoses = filters.filterByJsonPointers.call(this, jsonData, filter, '/@graph');

            diagnoses.should.be.an('array');
            diagnoses.should.have.length(3);

            Object.keys(diagnoses[0]).should.have.length(9);
            diagnoses[0]._id.should.equal("100417-4559064");
            diagnoses[0].type.should.equal(cmumpsType);
            diagnoses[0]['patient-100417'].should.deep.equal({id: "2-000007", label: "BUNNY,BUGS"});
            diagnoses[0]['status-100417'].should.equal("Active");
            diagnoses[0]['diagnosis-100417'].should.equal("V70.5 H");

            Object.keys(diagnoses[1]).should.have.length(9);
            diagnoses[1]._id.should.equal("100417-4562039");
            diagnoses[1].type.should.equal(cmumpsType);
            diagnoses[1]['patient-100417'].should.deep.equal({id: "2-000007", label: "BUNNY,BUGS"});
            diagnoses[1]['status-100417'].should.equal("Active");
            diagnoses[1]['diagnosis-100417'].should.equal("V72.12");

            Object.keys(diagnoses[2]).should.have.length(9);
            diagnoses[2]._id.should.equal("100417-4568875");
            diagnoses[2].type.should.equal(cmumpsType);
            diagnoses[2]['patient-100417'].should.deep.equal({id: "2-000007", label: "BUNNY,BUGS"});
            diagnoses[2]['status-100417'].should.equal("Active");
            diagnoses[2]['diagnosis-100417'].should.equal("V70.5 2");
        });

        it('should extract labwork from CMUMPS', function() {
            var cmumpsType = "cmumpss:Lab_Result-63";
            var filter = [{jsonpointer: "/type", value: cmumpsType}];
            var labwork = filters.filterByJsonPointers.call(this, jsonData, filter, '/@graph');
            labwork.should.be.an('array');
            labwork.should.have.length(1);

            Object.keys(labwork[0]).should.have.length(6);
            labwork[0]['_id'].should.equal("63-000007");
            labwork[0].type.should.equal(cmumpsType);
            labwork[0]["micro_conversion_flag-63"].should.deep.equal(
                {"id": "cmumpss:63__03_E-Micro_result_converted_for_4_41",
                 "label": "Micro_result_converted_for_4_41"}
            );
            labwork[0].label.should.equal("BUNNY,BUGS");
            labwork[0]["patient-63"].should.deep.equal({"id": "2-000007", "label": "BUNNY,BUGS"});

            Object.keys(labwork[0]["clinical_chemistry-63"]).should.have.length(5);
        });

        it('should extract prescriptions from CMUMPS', function() {
            var cmumpsType = "cmumpss:Prescription-52";
            var filter = [{jsonpointer: "/type", value: cmumpsType}];
            var prescriptions = filters.filterByJsonPointers.call(this, jsonData, filter, '/@graph');

            prescriptions.should.be.an('array');
            prescriptions.should.have.length(3);   // 3 prescriptions in the test data

            Object.keys(prescriptions[0]).should.have.length(29);
            prescriptions[0]._id.should.equal('52-40863');
            prescriptions[0].type.should.equal(cmumpsType);
            prescriptions[0]['drug-52']['id'].should.equal("50-260");

            Object.keys(prescriptions[1]).should.have.length(35);
            prescriptions[1]._id.should.equal('52-7810413');
            prescriptions[1].type.should.equal(cmumpsType);
            prescriptions[1]['drug-52']['id'].should.equal("50-234072");

            Object.keys(prescriptions[2]).should.have.length(35);
            prescriptions[2]._id.should.equal('52-7810414');
            prescriptions[2].type.should.equal(cmumpsType);
            prescriptions[2]['drug-52']['id'].should.equal("50-3621");
        });

        it('should extract procedures from CMUMPS', function() {
            var cmumpsType = "Procedure";
            var filter = [{jsonpointer: "/type", value: cmumpsType}];
            var procedures = filters.filterByJsonPointers.call(this, jsonData, filter, '/@graph');

            procedures.should.be.an('array');
            procedures.should.have.length(1);   // 1 procedure in the test data

            Object.keys(procedures[0]).should.have.length(11);
            procedures[0]._id.should.equal('Procedure-1074046');
            procedures[0].type.should.equal(cmumpsType);
            procedures[0].patient.should.deep.equal({id: 'Patient-000007', label: 'BUNNY,BUGS'});
            procedures[0].comments.should.equal('Encounter Procedure');
            procedures[0].verified.should.be.true;
            procedures[0].provider.should.deep.equal({"id": "Provider-41200034", "label": "MOUSE,MICKEY"});
        });

    });
});
