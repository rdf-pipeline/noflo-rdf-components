// cmumps-patient-jsonld-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var http = require('http');
var _ = require('underscore');
var noflo = require('noflo');
var test = require('./common-test');

describe('cmumps-patient-jsonld subgraph', function() {
    it("should build correct URL for patient 1000004", function() {
        var port = 1337;
        var server = http.createServer();
        afterEach(_.once(server.close.bind(server)));
        server.on('request', function(req, res) {
            res.end('"' + req.url + '"');
        });
        server.listen(port);
        return test.createNetwork({
            cmumps: "rdf-components/cmumps-patient-jsonld"
        }).then(function(network){
            var output = noflo.internalSocket.createSocket();
            network.processes.cmumps.component.outPorts.output.attach(output);
            return new Promise(function(done) {
                output.on('data', done);
                network.graph.addInitial('localhost:' + port, 'cmumps', 'authority');
                network.graph.addInitial('1000004', 'cmumps', 'patient_id');
            });
        }).should.eventually.have.property('data', "/patient_graph?dataset=cmumps-dataset&datatype=all&patientid=1000004");
    });
    it("should accept optional dataset", function() {
        var port = 1337;
        var server = http.createServer();
        afterEach(_.once(server.close.bind(server)));
        server.on('request', function(req, res) {
            res.end('"' + req.url + '"');
        });
        server.listen(port);
        return test.createNetwork({
            cmumps: "rdf-components/cmumps-patient-jsonld"
        }).then(function(network){
            var output = noflo.internalSocket.createSocket();
            network.processes.cmumps.component.outPorts.output.attach(output);
            return new Promise(function(done) {
                output.on('data', done);
                network.graph.addInitial('localhost:' + port, 'cmumps', 'authority');
                network.graph.addInitial('alt', 'cmumps', 'dataset');
                network.graph.addInitial('1000004', 'cmumps', 'patient_id');
            });
        }).should.eventually.have.property('data', "/patient_graph?dataset=alt&datatype=all&patientid=1000004");
    });
    xit("should GET remote jsonld for patient 1000004", function() {
        return test.createNetwork({
            cmumps: "rdf-components/cmumps-patient-jsonld"
        }).then(function(network){
            var output = noflo.internalSocket.createSocket();
            network.processes.cmumps.component.outPorts.output.attach(output);
            return new Promise(function(done) {
                output.on('data', done);
                network.graph.addInitial('1000004', 'cmumps', 'patient_id');
            });
        }).should.eventually.have.property('data').that.has.all.keys(['@context', '@graph']);
    });
});
