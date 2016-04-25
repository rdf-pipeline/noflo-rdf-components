// chcs-patient-jsonld-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var http = require('http');
var _ = require('underscore');
var noflo = require('noflo');
var test = require('./common-test');

describe('chcs-patient-jsonld subgraph', function() {
    it("should build correct URL for patient 1000004", function() {
        var port = 1337;
        var server = http.createServer();
        afterEach(_.once(server.close.bind(server)));
        server.on('request', function(req, res) {
            res.end('"' + req.url + '"');
        });
        server.listen(port);
        return test.createNetwork({
            chcs: "rdf-components/chcs-patient-jsonld"
        }).then(function(network){
            var output = noflo.internalSocket.createSocket();
            network.processes.chcs.component.outPorts.output.attach(output);
            return new Promise(function(done) {
                output.on('data', done);
                network.graph.addInitial('localhost:' + port, 'chcs', 'authority');
                network.graph.addInitial('1000004', 'chcs', 'patient_id');
            });
        }).should.eventually.have.property('data', "/patient_graph?dataset=chcs-ab&datatype=all&patientid=1000004");
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
            chcs: "rdf-components/chcs-patient-jsonld"
        }).then(function(network){
            var output = noflo.internalSocket.createSocket();
            network.processes.chcs.component.outPorts.output.attach(output);
            return new Promise(function(done) {
                output.on('data', done);
                network.graph.addInitial('localhost:' + port, 'chcs', 'authority');
                network.graph.addInitial('alt', 'chcs', 'dataset');
                network.graph.addInitial('1000004', 'chcs', 'patient_id');
            });
        }).should.eventually.have.property('data', "/patient_graph?dataset=alt&datatype=all&patientid=1000004");
    });
    xit("should GET remote jsonld for patient 1000004", function() {
        return test.createNetwork({
            chcs: "rdf-components/chcs-patient-jsonld"
        }).then(function(network){
            var output = noflo.internalSocket.createSocket();
            network.processes.chcs.component.outPorts.output.attach(output);
            return new Promise(function(done) {
                output.on('data', done);
                network.graph.addInitial('1000004', 'chcs', 'patient_id');
            });
        }).should.eventually.have.property('data').that.has.all.keys(['@context', '@graph']);
    });
});
