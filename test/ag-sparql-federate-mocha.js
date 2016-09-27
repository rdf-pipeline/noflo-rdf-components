// ag-sparql-federate-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
chai.should();
chai.use(chaiAsPromised);

var _ = require('underscore');
var http = require('http');
var os = require('os');
var fs = require('fs');
var path = require('path');
var noflo = require('noflo');
var test = require('./common-test');

describe('ag-sparql-federate', function() {
    var port = 1337;
    var origin = "http://localhost:" + port;
    it("should create and close a session with authentication", function() {
        this.timeout(5000);
        var requests = 0;
        var session;
        return new Promise(function(done, fail) {
            var server = http.createServer();
            afterEach(_.once(server.close.bind(server)));
            server.on('request', function(req, res) {
                requests++;
                if (!req.headers.authorization) fail("Missing authentication");
                var body = [];
                req.on('data', function(chunk) {
                    body.push(chunk);
                }).on('end', function() {
                    if (req.url.indexOf('/session') < 0)
                        session = Buffer.concat(body).toString();
                    res.end(origin + "/session");
                });
            });
            server.listen(port);
            var authFileName = path.join(os.tmpdir(), 'temp-ag-federate-auth');
            afterEach(_.once(fs.unlink.bind(fs, authFileName)));
            var listFileName = path.join(os.tmpdir(), 'temp-ag-federate-list');
            afterEach(_.once(fs.unlink.bind(fs, listFileName)));
            test.createNetwork({
                federate: "rdf-components/ag-sparql-federate"
            }).then(function(network) {
                test.onOutPortData(network.processes.federate.component, 'output', done);
                fs.writeFile(listFileName, origin + "/a\n" + origin + "/b", function(){
                    process.env['ag-federate-list-file'] = listFileName;
                    network.graph.addInitial('ag-federate-list-file', 'federate', 'target_list_file_env');
                    fs.writeFile(authFileName, 'QWxhZGRpbjpPcGVuU2VzYW1l', function(){
                        process.env['ag-federate-auth-file'] = authFileName;
                        network.graph.addInitial('ag-federate-auth-file', 'federate', 'auth_file_env');
                        network.graph.addInitial('rdf-insert-auth-file', 'federate', 'auth_file_env');
                        network.graph.addInitial(origin + "/", 'federate', 'target_url');
                        network.graph.addInitial('ASK {?s ?p ?o}', 'federate', 'sparql_query');
                        network.graph.addInitial({}, 'federate', 'input');
                    });
                });
            }).catch(fail);
        }).then(function(output) {
            requests.should.eq(3);
            output.should.have.property("data", origin + "/session");
            session.should.eq("<" + origin + "/a>+<" + origin + "/b>");
        });
    });
});
