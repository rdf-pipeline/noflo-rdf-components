// merge-patient-lab-iips-mocha.js

var chai = require('chai');

var assert = chai.assert;
var expect = chai.expect;

var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var sinon = require('sinon');

var _ = require('underscore');

var compFactory = require('../components/merge-patient-lab-iips');

var test = require('./common-test');
var stubs = require('./common-stubs');

describe('merge-patient-lab-iips', function() {
 
    it("should have have the expected node facade", function() {
        var node = test.createComponent(compFactory);

        node.should.be.an('object');
        node.should.include.keys('nodeName', 'componentName', 'inPorts', 'outPorts',
                                   'deleteAllVnis', 'deleteVni', 'vni', 'vnis');

        node.inPorts.should.be.an('object'); 
        node.outPorts.should.be.an('object'); 

        node.deleteAllVnis.should.be.a('function');
        node.deleteVni.should.be.a('function');
        node.vni.should.be.a('function');
        node.vnis.should.be.an('object');
    });

    it("should have have expected input & output ports", function() {
        var node = test.createComponent(compFactory);

        node.inPorts.should.be.an('object'); 
        node.inPorts.should.have.all.keys('patient', 'labwork');
        node.inPorts.patient.should.be.an('object');
        node.inPorts.labwork.should.be.an('object');

        node.outPorts.should.be.an('object'); 
        node.outPorts.should.have.all.keys('output', 'error');
        node.outPorts.output.should.be.an('object');
        node.outPorts.error.should.be.an('object');
    });

    describe('#vni', function() {

        it("should return a vni facade", function() {
            var node = test.createComponent(compFactory);
            var vni = node.vni();

            expect(vni).to.be.an('object');
            vni.should.have.all.keys('vnid', 'delete', 'errorState', 
                                      'inputStates', 'outputState', 'nodeInstance');

            vni.vnid.should.be.a('string');
            vni.delete.should.be.a('function');
            vni.errorState.should.be.a('function');
            vni.inputStates.should.be.a('function');
            vni.outputState.should.be.a('function');
            vni.nodeInstance.should.be.an('object');
        });

        describe('#errorState', function() {

            it("should initially return empty error state", function() {
                var node = test.createComponent(compFactory);
                var errorState = node.vni().errorState();
                errorState.should.be.an('object');
                errorState.vnid.should.equal('');
            });

            it("should set error state", function() {
                var node = test.createComponent(compFactory);
                var errorState = {
                    vnid: '',
                    data: Error('Setting an error message'),
                    error: undefined,
                    stale: undefined,
                    groupLm: undefined,
                    lm: 'LM1328113669.00000000000000001'
                };
                node.vni().errorState(_.clone(errorState));
                node.vni().errorState().should.eql(errorState);
            });

            it("should update error state", function() {
                var node = test.createComponent(compFactory);
          
                // Set initial error state
                var errorState = {
                    vnid: '',
                    data: Error('Setting an error message'),
                    error: undefined,
                    stale: undefined,
                    groupLm: undefined,
                    lm: 'LM1328113669.00000000000000001'
                };
                node.vni().errorState(_.clone(errorState));
                var currentState = node.vni().errorState();
                currentState.should.eql(errorState);

                // Set another error state
                var newData = "Setting a different error message";
                var newLm = 'LM1328113731.00000000000000000';

                currentState.data = newData;
                currentState.lm = newLm;
                node.vni().errorState(currentState);

                currentState = node.vni().errorState();
                test.verifyState(node.vni().errorState(),
                                  errorState.vnid, newData, errorState.error);
            });
        });

        describe('#inputStates', function() {

            it("should initially return undefined", function() {
                var node = test.createComponent(compFactory);
                expect(node.vni().inputStates('patient')).to.be.undefined;
                expect(node.vni().inputStates('labwork')).to.be.undefined;
            });

            it("should have input state after input", function() {
                var node = test.createComponent(compFactory);

                // initialize state to testState
                var testPatientState = { vnid: '001',
                                         data: { id: '001', name: 'Alice', dob: '1979-01-23' },
                                         error: undefined,
                                         lm: 'LM1328113669.00000000000000001'
                                       };
                node.vni().inputStates({ 'patient': _.mapObject(testPatientState, _.clone) });

                var testLabState = { vnid: '001',
                                     data: { key: '001', glucose: '74', date: '2012-02-01' },
                                     error: undefined,
                                     lm: 'LM1328163661.000000000000000001' 
                                   };
                node.vni().inputStates({ 'labwork': _.mapObject(testLabState, _.clone) });

                // Get patient port input state and verify it matches what was set
                node.vni().inputStates('patient').should.eql(testPatientState);
                node.vni().inputStates('labwork').should.eql(testLabState);
            });

            it("should update input state data", function() {

                var node = test.createComponent(compFactory);

                // set an initial patient state 
                var patientState = {
                    vnid: '001',
                    data: { id: '001', name: 'Alice', dob: '1969-01-23' },
                    error: undefined,
                    stale: undefined,
                    groupLm: undefined,
                    lm: 'LM1328113669.00000000000000001'
                };
                node.vni().inputStates({'patient': _.mapObject(patientState, _.clone)});

                var currentState = node.vni().inputStates('patient');
                currentState.should.eql(patientState);

                // Now update to a new patient state with a full name in data, 
                // and a new LM and verify we have it
                var newData =  { id: '001', name: 'Alice Waters', dob: '1969-01-23' };
                currentState.data = newData;
                var newLm = 'LM1328113731.00000000000000000';
                currentState.lm = newLm;
                node.vni().inputStates({'patient': currentState });

                // verify it
                test.verifyState(node.vni().inputStates('patient'), 
                                 patientState.vnid, newData, patientState.error);
            });
        });

        describe('#outputState', function() {

            it("should initially return empty output state", function() {
                var node = test.createComponent(compFactory);
                var outputState = node.vni().outputState();
                outputState.should.be.an('object');
                outputState.vnid.should.equal('');
            });

            it("should have a output state after input", function() {
                var node = test.createComponent(compFactory);
                // initialize state
                var mergedState = { vnid: '001',
                                    data: { id: '001', name: 'Alice', dob: '1979-01-23', 
                                            glucose: '75',  date: '2012-02-01' },
                                    error: false,
                                    stale: undefined,
                                    groupLm: undefined,
                                    lm: 'LM1328113669.00000000000000001' };
                node.vni().outputState(_.mapObject(mergedState, _.clone));

                var currentState = node.vni().outputState();
                currentState.should.eql(mergedState);
            });

            it("should update the output state", function() {
                var node = test.createComponent(compFactory);
                // initialize state
                var outputState = { vnid: '001',
                                    data: { id: '001', name: 'Alice', dob: '1979-01-23',
                                            glucose: '75', date: '2012-02-01' },
                                    error: false,
                                    stale: undefined,
                                    groupLm: undefined,
                                    lm: 'LM1328113669.00000000000000001' };
                node.vni().outputState(_.mapObject(outputState, _.clone));

                // verify it's right
                var currentState = node.vni().outputState();
                currentState.should.eql(outputState);

                // update state
                var newData = { id: '001', name: 'Alice', dob: '1979-01-23',
                                glucose: '75', date: '2012-02-01' };
                currentState.data = newData;

                newError = true;
                currentState.error = newError;

                newStale = false;
                currentState.stale = newStale;

                currentState.lm = 'LM1328113771.00000000000000000';
                node.vni().outputState(currentState);

                // verify it
                test.verifyState(node.vni().outputState(), 
                                 outputState.vnid, newData, newError, newStale);

            });
        });
    });

    describe('#updater', function() {

        it("updater should merge patient and labwork js object records into one object", function() {
            var data = compFactory.updater(
                {id: '001',  name: 'Alice', dob: '1979-01-23' },
                {id: '001',  glucose: '75',  date: '2012-02-01'}
           );
           data.should.be.an('object');
           data.should.have.all.keys('id', 'name', 'dob', 'glucose', 'date');
           data.id.should.equal('001');
           data.name.should.equal('Alice');
           data.dob.should.equal('1979-01-23');
           data.glucose.should.equal('75');
           data.date.should.equal('2012-02-01');
        });

        it("updater should merge patient and labwork stringified json records into one object", function() {
            var data = compFactory.updater(
                '{"id": "001", "name": "David", "dob": "1959-01-23" }',
                '{"id": "001", "glucose": "85", "date": "2013-02-01" }'
           );
           data.should.be.an('object');
           data.should.have.all.keys('id', 'name', 'dob', 'glucose', 'date');
           data.id.should.equal('001');
           data.name.should.equal('David');
           data.dob.should.equal('1959-01-23');
           data.glucose.should.equal('85');
           data.date.should.equal('2013-02-01');
        });

        it("updater should merge patient and labwork with patient attributes overriding labwork", function() {
            var data = compFactory.updater(
                {id: '001',  name: 'James', dob: '1969-01-23', glucose: '80' },
                {id: '001',  glucose: '75',  date: '2014-02-01'}
           );
           data.should.be.an('object');
           data.should.have.all.keys('id', 'name', 'dob', 'glucose', 'date');
           data.id.should.equal('001');
           data.name.should.equal('James');
           data.dob.should.equal('1969-01-23');
           data.glucose.should.equal('75');
           data.date.should.equal('2014-02-01');
        });

        it("updater should work even if patient is not defined", function() {
            var data = compFactory.updater(
                undefined,
                {id: '002',  glucose: '70',  date: '2010-02-01'}
           );
           data.should.be.an('object');
           data.should.have.all.keys('id', 'glucose', 'date');
           data.id.should.equal('002');
           data.glucose.should.equal('70');
           data.date.should.equal('2010-02-01');
        });

        it("updater should work even if labwork is not defined", function() {
            var data = compFactory.updater(
                {id: '003',  name: 'Mike', dob: '1960-01-23' },
                undefined
            );
            data.should.be.an('object');
            data.should.have.all.keys('id', 'name', 'dob');
            data.id.should.equal('003');
            data.name.should.equal('Mike');
            data.dob.should.equal('1960-01-23');
        });

        it("updater should work even if called with no data", function() {
            var data = compFactory.updater();
            data.should.be.an('object');
            data.should.be.empty;
        });
    });

    describe('functional behavior', function() {

        it("should have input states after input", function() {
            var node = test.createComponent(compFactory);
            test.sendData(node, 'patient',
                           {id: '001',  name: 'Alice', dob: '1979-01-23' });

            stubs.promiseLater().then(function(){
                return node.vni().inputStates('patient');
            }).then(_.keys).then(_.sortBy).should.become(_.sortBy(['vnid', 'data', 'error', 'lm', 'stale'])); 
        });

        it("should have patient input state data after input", function() {
            var node = test.createComponent(compFactory);
            test.sendData(node, 'patient',
                           {id: '001',  name: 'Alice', dob: '1979-01-23' });
            stubs.promiseLater().then(function(){
                return node.vni().inputStates('patient');
            }).then(_.property('data')).should.become({id: '001',  name: 'Alice', dob: '1979-01-23' });
        });

        it("should have labwork input state after input", function() {
            var node = test.createComponent(compFactory);
            test.sendData(node, 'labwork',
                                         {id: '001',  glucose: '75',  date: '2012-02-01'});
            stubs.promiseLater().then(function(){
                return node.vni().inputStates('labwork');
            }).then(_.keys).then(_.sortBy).should.become(_.sortBy(['data', 'lm']));
        });

        it("should have labwork input state data after input", function() {
            var node = test.createComponent(compFactory);
            test.sendData(node, 'labwork',
                                         {id: '001',  glucose: '75',  date: '2012-02-01'});
            stubs.promiseLater().then(function(){
                return node.vni().inputStates('labwork');
            }).then(_.property('data')).should.become({id: '001',  glucose: '75',  date: '2012-02-01'});
        });

        it("should have patient and labwork output state after input ports processing", function() {

            this.timeout(3250);
            return test.createNetwork(
                { node1: 'core/Repeat',
                  node2: 'core/Repeat',
                  node3: { getComponent: compFactory }
            }).then(function(network) {

                return new Promise(function(done, fail) {

                    // True noflo component - not facade
                    var node = network.processes.node3.component;
    
                    test.onOutPortData(node, 'output', done);
                    test.onOutPortData(node, 'error', fail);
    
                    network.graph.addEdge('node1', 'out', 'node3', 'patient');
                    network.graph.addEdge('node2', 'out', 'node3', 'labwork');

                    network.graph.addInitial({id: '001', name: 'Alice', dob: '1979-01-23'}, 'node1', 'in');
                    network.graph.addInitial({id: '001', glucose: '75', date: '2012-02-01'}, 'node2', 'in');

                }).then(function(done) {

                    // verify we got the output state we expect
 
                    done.should.exist;
                    done.should.not.be.empty;
                    done.should.have.ownProperty('vnid');
                    done.vnid.should.equal('');
                    done.should.be.an('object');
                    done.should.have.ownProperty('data');

                    var data = done.data;
                    data.should.be.an('object');
                    data.should.have.all.keys('id', 'name', 'dob', 'glucose', 'date');
                    data.id.should.equal('001');
                    data.name.should.equal('Alice');
                    data.dob.should.equal('1979-01-23');
                    data.glucose.should.equal('75');
                    data.date.should.equal('2012-02-01');
                });
            });
        });

        it("should handle JSON parse errors", function() {
            this.timeout(2500);
            var node = test.createComponent(compFactory);
            sinon.stub(console, 'error');
            return new Promise(function(done, fail){

                test.onOutPortData(node, 'error', fail);
                test.onOutPortData(node, 'output', done);

                test.sendData(node, 'patient',
                              '{"id": "001", "name": "David", "dob": "1959-01-23" }');

                // Note that this labwork record is not JSON - id is a mess and
                // should cause a json parse error to be thrown
                test.sendData(node,'labwork',
                               '{"id 001, "glucose": "85", "date": "2013-02-01" }');

             }).then(function(payload){

                console.error.restore();
                payload.should.exist;
                payload.should.not.be.empty;
                payload.should.have.all.keys('vnid', 'data', 'error', 'stale', 'lm', 'groupLm');
                payload.vnid.should.equal('');
                payload.data.should.be.an('object');
                payload.data.id.should.equal("001");
                payload.data.name.should.equal("David");
                payload.data.dob.should.equal("1959-01-23");
                payload.error.should.be.true;
                expect(payload.stale).to.be.undefined;
                expect(payload.groupLm).to.be.undefined;
                payload.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);

                var errorState = node.vni().errorState();
                errorState.data.toString().should.contain('Error: Unable to parse parameter');
             }, function(fail) {

                console.error.restore();
                assert.isNotOk(fail);
             });
        });
    });

});
