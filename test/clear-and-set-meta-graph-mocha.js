// rdf-insert-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var http = require('http');
var _ = require('underscore');
var os = require('os');
var fs = require('fs');
var path = require('path');
var noflo = require('noflo');
var test = require('./common-test');

describe('clear-and-set-meta-graph', function() {
    var port = 1337;
    it("should execute SPARQL and the given endpoint", function() {
        var server = http.createServer();
        server.on('request', function(req, res) {
            var body = [];
            req.on('data', function(chunk) {
                body.push(chunk);
            }).on('end', function() {
                body = Buffer.concat(body).toString();
                res.end(body);
            });
        });
        server.listen(port);
        return test.createNetwork({
            meta: "rdf-components/clear-and-set-meta-graph"
        }).then(function(network){
            var output = noflo.internalSocket.createSocket();
            network.processes.meta.component.outPorts.output.attach(output);
            return new Promise(function(done) {
                output.on('data', done);
                network.graph.addInitial("http://localhost:" + port + "/", 'meta', 'sparql_endpoint');
                network.graph.addInitial('urn:test:graph', 'meta', 'target_graph_uri');
            });
        }).should.eventually.contain('PREFIX').and.not.contain('{{').notify(server.close.bind(server));
    });
    it("should execute using the provided credentials", function() {
        var server = http.createServer();
        server.on('request', function(req, res) {
            res.end(req.headers.authorization);
        });
        server.listen(port);
        var authFileName = path.join(os.tmpdir(), 'temp-rdf-insert-auth');
        return test.createNetwork({
            meta: "rdf-components/clear-and-set-meta-graph"
        }).then(function(network){
            return new Promise(function(done) {
                test.onOutPortData(network.processes.meta.component, 'output', done);
                process.env['rdf-insert-auth-file'] = authFileName;
                fs.writeFile(authFileName, 'QWxhZGRpbjpPcGVuU2VzYW1l', function(){
                    network.graph.addInitial('rdf-insert-auth-file', 'meta', 'auth_file_env');
                    network.graph.addInitial("http://localhost:" + port + "/", 'meta', 'sparql_endpoint');
                    network.graph.addInitial('urn:test:graph', 'meta', 'target_graph_uri');
                });
            });
        }).should.become('Basic QWxhZGRpbjpPcGVuU2VzYW1l').notify(function(){
            server.close();
            fs.unlink(authFileName);
        });
    });
});
