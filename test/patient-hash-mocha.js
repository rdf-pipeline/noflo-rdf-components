// patient-hash-mocha.js

var chai = require("chai");
var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var fs = require('fs');

var test = require("./common-test");
var factory = require("../components/patient-hash");
var logger = require("../src/logger");

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
            sinon.stub(logger, 'warn');
            expect(factory.updater.bind(this, 
                                       {"type": "cmumpss:Patient-2", "_id": "2-000007"},
                                       {demographics: 'rdf-components/translate-demographics-cmumps2fhir',
                                        bizarro: 'rdf-components/bizarro'}
                              )).to.throw(Error,
                /Unknown translation. Supported translators are: 'demographics', 'diagnosis', 'prescriptions', 'procedures'./);
            logger.warn.restore();
        });

        it("should throw an error if given no demographic data", function() {
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
            var prescriptionId = prescriptionType + ':' + prescriptionId;

            var testdata = 
                { "@context": "https://raw.githubusercontent.com/rdf-pipeline/translators/master/data/fake_cmumps/patient-7/context.jsonld", 
                  "@graph": [ prescription ]}; 

            // Invoke component updater
            var node = test.createComponent(factory);
            var vni = node.vni('');
            sinon.stub(logger, 'warn');
            expect(factory.updater.bind(vni, testdata)).to.throw(Error,
                /No patient demographics found!/);
            logger.warn.restore();
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

            sinon.stub(logger, 'warn');
            var hash = factory.updater.call(vni, testdata);
            logger.warn.restore();

	    hash.should.be.an('object');

            var demographicsId = demographicsType+':'+patientId+':'+patientId;
            hash.should.have.keys(demographicsId);

            hash[demographicsId].should.be.an('object');
            hash[demographicsId].should.have.keys('data', 'translateBy');
            hash[demographicsId].translateBy.should.equal('rdf-components/translate-demographics-cmumps2fhir');
            hash[demographicsId].data.should.deep.equal(demographics);

            vni.outputState().patientId.should.equal(patientId);
        });

        it("should generate a hash if given diagnosis & demographics data", function() {
            var demographicsType = "cmumpss:Patient-2";
            var patientId = "2-000007";
            var demographics = { "type": demographicsType,
                                 "_id": patientId  };

            var demographicsId = demographicsType + ':' + patientId + ':' + patientId;

            var diagnosisType = "cmumpss:Kg_Patient_Diagnosis-100417";
            var diagnosisId = "100417-4559064";
            var diagnosis = {
                "_id": "100417-4559064",
                "type": "cmumpss:Kg_Patient_Diagnosis-100417",
                "label": "27642;OTHER EXAMINATION DEFINED POPULATION",
                "problem-100417": "27642;OTHER EXAMINATION DEFINED POPULATION",
                "patient-100417": {
                    "id": "2-000007",
                    "label": "BUNNY,BUGS"
                },
                "status-100417": "Active",
                "location-100417": {
                    "id": "44-154",
                    "label": "OPTOMETRY ANY HEALTH CLINIC"
                },
                "date_of_onset-100417": {
                    "value": "1990-01-01",
                    "type": "xsd:date"
                },
                "diagnosis-100417": "V70.5 H"
            };
            diagnosisId = diagnosisType + ':' + patientId + ':' + diagnosisId;

            var testdata = 
                { "@context": "https://raw.githubusercontent.com/rdf-pipeline/translators/master/data/fake_cmumps/patient-7/context.jsonld", 
                  "@graph": [ demographics,  diagnosis ]}; 

            // Invoke component updater
            var node = test.createComponent(factory);
            var vni = node.vni('');
            sinon.stub(logger, 'warn');
            var hash = factory.updater.call(vni, testdata);
            logger.warn.restore();

            Object.keys(hash).should.have.length(2); 
            hash.should.have.all.keys( demographicsId, diagnosisId);

            hash[demographicsId].should.be.an('object');
            hash[demographicsId].should.have.keys('data', 'translateBy');
            hash[demographicsId].translateBy.should.equal('rdf-components/translate-demographics-cmumps2fhir');
            hash[demographicsId].data.should.deep.equal(demographics);
            
            hash[diagnosisId].should.be.an('object');
            hash[diagnosisId].should.have.keys('data', 'translateBy');
            hash[diagnosisId].translateBy.should.equal('rdf-components/translate-diagnosis-cmumps2fhir');
            hash[diagnosisId].data.should.deep.equal(diagnosis);

            vni.outputState().patientId.should.equal(patientId);
        });

        it("should generate a hash if given prescription & demographics data", function() {
            var demographicsType = "cmumpss:Patient-2";
            var patientId = "2-000007";
            var demographics = { "type": demographicsType,
                                 "_id": patientId  };

            var demographicsId = demographicsType + ':' + patientId + ':' + patientId;

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
            prescriptionId = prescriptionType + ':' + patientId + ':' + prescriptionId;

            var testdata = 
                { "@context": "https://raw.githubusercontent.com/rdf-pipeline/translators/master/data/fake_cmumps/patient-7/context.jsonld", 
                  "@graph": [ demographics,  prescription ]}; 

            // Invoke component updater
            var node = test.createComponent(factory);
            var vni = node.vni('');
            sinon.stub(logger, 'warn');
            var hash = factory.updater.call(vni, testdata);
            logger.warn.restore();

            Object.keys(hash).should.have.length(2); // will have demographics, prescription 
            hash.should.have.all.keys( demographicsId, prescriptionId);

            hash[demographicsId].should.be.an('object');
            hash[demographicsId].should.have.keys('data', 'translateBy');
            hash[demographicsId].translateBy.should.equal('rdf-components/translate-demographics-cmumps2fhir');
            hash[demographicsId].data.should.deep.equal(demographics);
            
            hash[prescriptionId].should.be.an('object');
            hash[prescriptionId].should.have.keys('data', 'translateBy');
            hash[prescriptionId].translateBy.should.equal('rdf-components/translate-prescription-cmumps2fhir');
            hash[prescriptionId].data.should.deep.equal(prescription);

            vni.outputState().patientId.should.equal(patientId);
        });

        it("should generate a hash if given procedure & demographics data", function() {
            var demographicsType = "cmumpss:Patient-2";
            var patientId = "2-000007";
            var demographics = { "type": demographicsType,
                                 "_id": patientId  };

            var demographicsId = demographicsType + ':' + patientId + ':' + patientId;

            var procedureId = "Procedure-1074046";
            var procedureType = 'Procedure';
            var procedure = { 
                type: procedureType,
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
            procedureId = procedureType+':' + patientId + ':' + procedureId;

            var testdata = 
                { "@context": "https://raw.githubusercontent.com/rdf-pipeline/translators/master/data/fake_cmumps/patient-7/context.jsonld", 
                  "@graph": [ demographics, procedure ]}; 

            // Invoke component updater
            var node = test.createComponent(factory);
            var vni = node.vni('');
            sinon.stub(logger, 'warn');
            var hash = factory.updater.call(vni, testdata);
            logger.warn.restore();

            hash.should.have.all.keys( demographicsId, procedureId);

            hash[procedureId].should.be.an('object');
            hash[procedureId].should.have.keys('data', 'translateBy');
            hash[procedureId].translateBy.should.equal('rdf-components/translate-procedure-cmumps2fhir');
            hash[procedureId].data.should.deep.equal(procedure);

            vni.outputState().patientId.should.equal(patientId);
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
            var demographicsId = demographicsType+':' + patientId + ':' + patientId;

            var testdata = 
                { "@context": "https://raw.githubusercontent.com/rdf-pipeline/translators/master/data/fake_cmumps/patient-7/context.jsonld", 
                  "@graph": [ demographics ]}; 

            var customTranslators = {
                demographics: 'rdf-components/custom-demographics-translator',
                prescription: 'rdf-components/custom-prescription-translator',
                procedure: 'rdf-components/custom-procedure-translator'}


            // Invoke component updater
            sinon.stub(logger, 'warn');
            var node = test.createComponent(factory);
            var vni = node.vni('');
            var hash = factory.updater.call(vni, testdata, customTranslators);
            logger.warn.restore();

	    hash.should.be.an('object');

            hash.should.have.keys(demographicsId);

            hash[demographicsId].should.be.an('object');
            hash[demographicsId].should.have.keys('data', 'translateBy');
            hash[demographicsId].translateBy.should.equal(customTranslators.demographics);
            hash[demographicsId].data.should.deep.equal(demographics);

            vni.outputState().patientId.should.equal(patientId);
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

                    sinon.stub(logger, 'warn');
                    network.graph.addInitial(parsedData, 'repeaterNode', 'in');

                }).then(function(done) {
                    logger.warn.restore();
                    done.vnid.should.equal('');
                    done.data.should.be.an('object');
                    done.data.should.have.keys('cmumpss:Patient-2:2-000007:2-000007', 
                                               'cmumpss:Kg_Patient_Diagnosis-100417:2-000007:100417-4559064',
                                               'cmumpss:Kg_Patient_Diagnosis-100417:2-000007:100417-4562039',
                                               'cmumpss:Kg_Patient_Diagnosis-100417:2-000007:100417-4568875',
                                               'cmumpss:Prescription-52:2-000007:52-40863',
                                               'cmumpss:Prescription-52:2-000007:52-7810413',
                                               'cmumpss:Prescription-52:2-000007:52-7810414',
                                               'Procedure:2-000007:Procedure-1074046');
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
