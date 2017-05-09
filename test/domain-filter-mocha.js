// domain-filter-mocha.js

var _ = require('underscore');

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var fs = require('fs');

var factory = require('../components/domain-filter');
var test = require('./common-test');

var jsonData = JSON.parse(fs.readFileSync(__dirname + '/data/cmumps-patient7.jsonld','utf8'));

describe('domain-filter', function() {

    it('should exist as a function', function() {
        factory.should.exist;
        factory.should.be.a('function');
    });

    describe('#updater', function() {
        it('should throw an error if no data was specified', function() {
            expect(factory.updater.bind(this, undefined)).to.throw(Error,
                /Domain filter component requires data to process!/);
        });

        it('should throw an error if data is empty', function() {
            expect(factory.updater.bind(this, '')).to.throw(Error,
                /Domain filter component requires data to process!/);
        });

        it('should throw an error if domain is not specified', function() {
            expect(factory.updater.bind(this, [{"data": "alpha"}])).to.throw(Error,
                   /Domain filter component received invalid domain: undefined/);
        });

        it('should throw an error if unkonwn domain is specified', function() {
            expect(factory.updater.bind(this, [{"data": "alpha"}], "unknownDomain")).to.throw(Error,
                   /Domain filter component received unknown domain: unknownDomain!/);
        });

        it('should throw an error if no prefix specified on domain that requires a prefix', function() {
            expect(factory.updater.bind(this, [{"alpha": "beta"}], 'demographics')).to.throw(Error,
                /Domain filter component domain demographics requires a prefix but none was specified!/);
        });

        it('should extract demographics from CMUMPS', function() {
            var node = test.createComponent(factory);
            var vni = node.vni('');

            var demographics = factory.updater.call(vni, jsonData, 'demographics', 'cmumpss');

            demographics.should.be.an('array');
            demographics.should.have.length(1);

            demographics[0].should.be.an('object');
            Object.keys(demographics[0]).should.have.length(48);

            demographics[0]._id.should.equal('2-000007');
            demographics[0].type.should.equal("cmumpss:Patient-2");
            demographics[0]['sex-2'].should.deep.equal({ id: 'cmumpss:2__02_E-MALE', label: 'MALE' });
            demographics[0]['organ_donor-2'].should.deep.equal({ id: 'cmumpss:2_9001_01_E-UNDECIDED', label: 'UNDECIDED' });
        });

        it('should extract diagnoses from CMUMPS', function() {
            var node = test.createComponent(factory);
            var vni = node.vni('');

            var diagnoses = factory.updater.call(vni, jsonData, 'diagnoses', 'cmumpss');

            diagnoses.should.be.an('array');
            diagnoses.should.have.length(3);

            Object.keys(diagnoses[0]).should.have.length(9);
            diagnoses[0]._id.should.equal("100417-4559064");
            diagnoses[0].type.should.equal("cmumpss:Kg_Patient_Diagnosis-100417");
            diagnoses[0]['patient-100417'].should.deep.equal({id: "2-000007", label: "BUNNY,BUGS"});
            diagnoses[0]['status-100417'].should.equal("Active");
            diagnoses[0]['diagnosis-100417'].should.equal("V70.5 H");

            Object.keys(diagnoses[1]).should.have.length(9);
            diagnoses[1]._id.should.equal("100417-4562039");
            diagnoses[1].type.should.equal("cmumpss:Kg_Patient_Diagnosis-100417");
            diagnoses[1]['patient-100417'].should.deep.equal({id: "2-000007", label: "BUNNY,BUGS"});
            diagnoses[1]['status-100417'].should.equal("Active");
            diagnoses[1]['diagnosis-100417'].should.equal("V72.12");

            Object.keys(diagnoses[2]).should.have.length(9);
            diagnoses[2]._id.should.equal("100417-4568875");
            diagnoses[2].type.should.equal("cmumpss:Kg_Patient_Diagnosis-100417");
            diagnoses[2]['patient-100417'].should.deep.equal({id: "2-000007", label: "BUNNY,BUGS"});
            diagnoses[2]['status-100417'].should.equal("Active");
            diagnoses[2]['diagnosis-100417'].should.equal("V70.5 2");
        });

        it('should extract labs from CMUMPS', function() {
            var node = test.createComponent(factory);
            var vni = node.vni('');

            var labwork = factory.updater.call(vni, jsonData, 'labs', 'cmumpss');

            labwork.should.be.an('array');
            labwork.should.have.length(1);

            Object.keys(labwork[0]).should.have.length(6);
            labwork[0]['_id'].should.equal("63-000007");
            labwork[0].type.should.equal("cmumpss:Lab_Result-63");
            labwork[0]["micro_conversion_flag-63"].should.deep.equal(
                {"id": "cmumpss:63__03_E-Micro_result_converted_for_4_41",
                 "label": "Micro_result_converted_for_4_41"}
            );
            labwork[0].label.should.equal("BUNNY,BUGS");
            labwork[0]["patient-63"].should.deep.equal({"id": "2-000007", "label": "BUNNY,BUGS"});

            Object.keys(labwork[0]["clinical_chemistry-63"]).should.have.length(5);
        });

        it('should extract prescriptions from CMUMPS', function() {
            var node = test.createComponent(factory);
            var vni = node.vni('');

            var cmumpsType = "cmumpss:Prescription-52";
            var filter = [{jsonpointer: "/type", value: cmumpsType}];
            var prescriptions = factory.updater.call(vni, jsonData, 'prescriptions', 'cmumpss');

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
            var node = test.createComponent(factory);
            var vni = node.vni('');

            // No prefix on procedures because the AHLTA data we have been working 
            // with, has no prefix - this differs from all other types
            var procedures = factory.updater.call(vni, jsonData, 'procedures');

            procedures.should.be.an('array');
            procedures.should.have.length(1);   // 1 procedure in the test data

            Object.keys(procedures[0]).should.have.length(11);
            procedures[0]._id.should.equal('Procedure-1074046');
            procedures[0].type.should.equal("Procedure");
            procedures[0].patient.should.deep.equal({id: 'Patient-000007', label: 'BUNNY,BUGS'});
            procedures[0].comments.should.equal('Encounter Procedure');
            procedures[0].verified.should.be.true;
            procedures[0].provider.should.deep.equal({"id": "Provider-41200034", "label": "MOUSE,MICKEY"});
        });

    });
});
