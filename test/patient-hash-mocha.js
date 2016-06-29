// patient-hash-mocha.js

var chai = require("chai");
var expect = chai.expect;
var should = chai.should();

var fs = require('fs');

var test = require("./common-test");
var factory = require("../components/patient-hash");

describe("patient-hash", function() {

    it("should exist as a function", function() {
        factory.should.exist;
        factory.should.be.a("function");
    });

    it("should instantiate a noflo component", function() {
        var node = test.createComponent(factory);
        node.should.be.an("object");
        node.should.include.keys("nodeName", "componentName", "outPorts", "inPorts", "vni", "vnis");
    });

    describe("#patientHash", function() {

        it("should throw an error if patient_json is undefined", function() {
            expect(factory.updater.bind(this, undefined)).to.throw(Error,
                /Patient hash component found no patient json!/);
        });

        it("should throw an error if given an unknown translator", function() {
            expect(factory.updater.bind(this, 
                                       {"type": "cmumpss:Patient-2", "_id": "2-000007"},
                                       {demographics: 'rdf-components/translate-demographics-cmumps2fhir',
                                        bizarro: 'rdf-components/bizarro'}
                              )).to.throw(Error,
                /Unknown translation. Supported translators are: 'demographics', 'prescriptions', 'procedures'./);
        });

        it("should generate a hash if given only demographic data", function() {
            var demographicsType = "cmumpss:Patient-2";
            var patientId = "2-000007";
            var demographics = { "type": demographicsType,
                                 "_id": patientId, 
                                 "patient_ssn-2": "777777777",
                                 "street_address-2": "100 MAIN ST",
                                 "city-2": "ANYTOWN",
                                 "zip_code-2": "60040",
                                 "state-2": "NY/USA",
                                 "label": "BUNNY,BUGS" };
            var testdata = 
                { "@context": "https://raw.githubusercontent.com/rdf-pipeline/translators/master/data/fake_cmumps/patient-7/context.jsonld", 
                  "@graph": [ demographics ]}; 

            // Invoke component updater
            var node = test.createComponent(factory);
            var vni = node.vni('');
            var hash = factory.updater.call(vni, testdata);
	    hash.should.be.an('object');

            var demographicsId = demographicsType+':'+patientId;
            var shexId = 'PatientRecord:'+patientId;
            hash.should.have.keys(demographicsId, shexId);

            hash[demographicsId].should.be.an('object');
            hash[demographicsId].should.have.keys('data', 'translateBy');
            hash[demographicsId].translateBy.should.equal('rdf-components/translate-demographics-cmumps2fhir');
            hash[demographicsId].data.should.deep.equal(demographics);

	    hash[shexId].should.be.an('object');
	    hash[shexId].should.have.keys('data', 'translateBy');
	    hash[shexId].data.should.deep.equal(testdata);
	    hash[shexId].translateBy.should.equal('rdf-components/shex-cmumps-to-rdf');
        });

        it("should generate a hash if given only lab data", function() {
            var labType = "cmumpss:Lab_Result-63";
            var labId = "2-000007";
            var lab = { "type": labType, 
                        "_id": "63-000007",
                        "label": "BUNNY,BUGS",
                        "patient-63": {
                            "id": "2-000007",
                            "label": "BUNNY,BUGS"
                        },
                        "clinical_chemistry-63": [
                            { "date_time_specimen_taken-63_04": {
                                "type": "xsd:dateTime",
                                "value": "1990-01-01T00:00:00"
                            }}
                        ]};

            var testdata = 
                { "@context": "https://raw.githubusercontent.com/rdf-pipeline/translators/master/data/fake_cmumps/patient-7/context.jsonld", 
                  "@graph": [ lab ]}; 

            // Invoke component updater
            var hash = factory.updater(testdata);
	    hash.should.be.an('object');

            Object.keys(hash).should.have.length(1); 
            var shexId = Object.keys(hash)[0];
            shexId.startsWith('PatientRecord:').should.be.true;

            hash[shexId].should.have.keys('data', 'translateBy');
	    hash[shexId].data.should.deep.equal(testdata);
	    hash[shexId].translateBy.should.equal('rdf-components/shex-cmumps-to-rdf');
        });

        it("should generate a hash if given only prescriptions data", function() {
            var prescriptionType = "cmumpss:Prescription-52";
            var prescriptionId = "52-7810414";
            var prescription = { _id: prescriptionId,
                                 type: prescriptionType,
                                 label: 'B636181',
                                 'rx_-52': 'B636181',
                                 'patient-52': { id: '2-000007', label: 'BUNNY, BUGS' },
                                 'provider-52': { id: '6-11111', label: 'DUCK,DONALD' },
                                 'drug-52':
                                  { id: '50-3621',
                                    label: 'RECLIPSEN TAB 28-DAY (DESOGEN EQ)',
                                    sameAs: 'nddf:cdc017616',
                                    sameAsLabel: 'RECLIPSEN 28 DAY TABLET' },
                                 'qty-52': '169',
                                 'days_supply-52': '84',
                                 'refills-52': '0',
                                 'logged_by-52': { id: '3-11111', label: 'DUCK,DONALD' }
                               };
            var testdata = 
                { "@context": "https://raw.githubusercontent.com/rdf-pipeline/translators/master/data/fake_cmumps/patient-7/context.jsonld", 
                  "@graph": [ prescription ]}; 

            // Invoke component updater
            var hash = factory.updater(testdata);
	    hash.should.be.an('object');

            var prescriptionId = prescriptionType+':'+prescriptionId;
            Object.keys(hash).should.have.length(2); // will have prescription & lab (for shex)
            hash.should.include.keys(prescriptionId);

            hash[prescriptionId].should.be.an('object');
            hash[prescriptionId].should.have.keys('data', 'translateBy');
            hash[prescriptionId].translateBy.should.equal('rdf-components/translate-prescription-cmumps2fhir');
            hash[prescriptionId].data.should.deep.equal(prescription);
        });

        it("should generate a hash if given only procedures data", function() {
            var procedureType = "Procedure";
            var procedureId = "Procedure-1074046";
            var procedure = { 
                type: 'Procedure',
                _id: 'Procedure-1074046',
                patient: { id: 'Patient-000007', label: 'BUNNY, BUGS' },
                description: { id: 'HDDConcept-67355',
                               label: 'Periodic comprehensive preventive medicine reevaluation'},
                comments: 'Encounter Procedure',
                status: { id: 'HDDConcept-1024', label: 'Active' },
                dateReported: { value: '1990-01-01T00:00:00', type: 'xsd#dateTime' },
                source: { id: 'HDDConcept-1450368', label: 'Clinical Evidence' },
                verified: true,
                provider: { id: 'Provider-41200034', label: 'MOUSE, MICKEY' } 
            };

            var testdata = 
                { "@context": "https://raw.githubusercontent.com/rdf-pipeline/translators/master/data/fake_cmumps/patient-7/context.jsonld", 
                  "@graph": [ procedure ]}; 

            // Invoke component updater
            var hash = factory.updater(testdata);
	    hash.should.be.an('object');

            var procedureId = procedureType+':'+procedureId;
            Object.keys(hash).should.have.length(2); // will have procedure & lab (for shex)
            hash.should.include.keys(procedureId);

            hash[procedureId].should.be.an('object');
            hash[procedureId].should.have.keys('data', 'translateBy');
            hash[procedureId].translateBy.should.equal('rdf-components/translate-procedure-cmumps2fhir');
            hash[procedureId].data.should.deep.equal(procedure);
        });

        it("should generate a hash with custom translators (non-default)", function() {
            var demographicsType = "cmumpss:Patient-2";
            var patientId = "2-000007";
            var demographics = { "type": demographicsType,
                                 "_id": patientId, 
                                 "patient_ssn-2": "777777777",
                                 "street_address-2": "100 MAIN ST",
                                 "city-2": "ANYTOWN",
                                 "zip_code-2": "60040",
                                 "state-2": "NY/USA",
                                 "label": "BUNNY,BUGS" };
            var testdata = 
                { "@context": "https://raw.githubusercontent.com/rdf-pipeline/translators/master/data/fake_cmumps/patient-7/context.jsonld", 
                  "@graph": [ demographics ]}; 

            var customTranslators = {
                demographics: 'rdf-components/custom-demographics-translator',
                labs: 'rdf-components/custom-labs-translator',
                prescription: 'rdf-components/custom-prescription-translator',
                procedure: 'rdf-components/custom-procedure-translator'}

            var node = test.createComponent(factory);
            var vni = node.vni('');

            // Invoke component updater
            var hash = factory.updater.call(vni, testdata, customTranslators);
	    hash.should.be.an('object');

            var demographicsId = demographicsType+':'+patientId;
            var shexId = 'PatientRecord:'+patientId;
            hash.should.have.keys(demographicsId, shexId);

            hash[demographicsId].should.be.an('object');
            hash[demographicsId].should.have.keys('data', 'translateBy');
            hash[demographicsId].translateBy.should.equal(customTranslators.demographics);
            hash[demographicsId].data.should.deep.equal(demographics);

	    hash[shexId].should.be.an('object');
	    hash[shexId].should.have.keys('data', 'translateBy');
	    hash[shexId].translateBy.should.equal(customTranslators.labs);
	    hash[shexId].data.should.deep.equal(testdata);
         });

        it("should generate a hash with custom & default translators", function() {
            var demographicsType = "cmumpss:Patient-2";
            var patientId = "2-000007";
            var demographics = { "type": demographicsType,
                                 "_id": patientId, 
                                 "patient_ssn-2": "777777777",
                                 "street_address-2": "100 MAIN ST",
                                 "city-2": "ANYTOWN",
                                 "zip_code-2": "60040",
                                 "state-2": "NY/USA",
                                 "label": "BUNNY,BUGS" };
            var testdata = 
                { "@context": "https://raw.githubusercontent.com/rdf-pipeline/translators/master/data/fake_cmumps/patient-7/context.jsonld", 
                  "@graph": [ demographics ]}; 

            var customTranslators = {demographics: 'rdf-components/custom-demographics-translator'};

            var node = test.createComponent(factory);
            var vni = node.vni('');

            // Invoke component updater
            var hash = factory.updater.call(vni, testdata, customTranslators);
	    hash.should.be.an('object');

            var demographicsId = demographicsType+':'+patientId;
            var shexId = 'PatientRecord:'+patientId;
            hash.should.have.keys(demographicsId, shexId);

            hash[demographicsId].should.be.an('object');
            hash[demographicsId].should.have.keys('data', 'translateBy');
            hash[demographicsId].translateBy.should.equal(customTranslators.demographics);
            hash[demographicsId].data.should.deep.equal(demographics);

	    hash[shexId].should.be.an('object');
	    hash[shexId].should.have.keys('data', 'translateBy');
	    hash[shexId].translateBy.should.equal('rdf-components/shex-cmumps-to-rdf');
	    hash[shexId].data.should.deep.equal(testdata);
         });
    });

    describe('functional behavior', function() {

        it("should execute in a noflo network", function() {
            return test.createNetwork({ 
                repeaterNode: 'core/Repeat',
                patientHashNode: 'rdf-components/patient-hash'
            }).then(function(network) {
                return new Promise(function(done) {

                    var repeaterNode = network.processes.repeaterNode.component;
                    var patientHashNode = network.processes.patientHashNode.component;
                    network.graph.addEdge('repeaterNode', 'out', 'patientHashNode', 'patient_json');

                    test.onOutPortData(patientHashNode, 'output', done);

                    var testFile = __dirname + '/data/cmumps-patient7.jsonld';
                    var data = fs.readFileSync(testFile);
                    var parsedData = JSON.parse(data); // readfile gives us a json object, so parse it


                    network.graph.addInitial(parsedData, 'repeaterNode', 'in');

                }).then(function(done) {
                    done.vnid.should.equal('');
                    done.data.should.be.an('object');
                    done.data.should.have.keys('cmumpss:Patient-2:2-000007', 
                                               'PatientRecord:2-000007',
                                               'cmumpss:Prescription-52:52-40863',
                                               'cmumpss:Prescription-52:52-7810413',
                                               'cmumpss:Prescription-52:52-7810414',
                                               'Procedure:Procedure-1074046');
                    Object.keys(done.data).forEach( function(key) { 
                        done.data[key].should.have.keys('data', 'translateBy');
                    });
                    expect(done.error).to.be.undefined;
                    expect(done.stale).to.be.undefined;
                    expect(done.groupLm).to.be.undefined;
                    done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3); 
                    done.patientId.should.equal('2-000007'); // verify patient ID metadata is there
                });
            });
        });
    });
});
