// load-balancer-mocha.js

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

describe('load-balancer', function() {
    var port = 1337;
    it("should POST input to single target", function() {
	this.timeout(4000);
        return new Promise(function(done, fail){
            var server = http.createServer();
            afterEach(_.once(server.close.bind(server)));
            server.once('request', function(req, res) {
                var body = [];
                req.on('data', function(chunk) {
                    body.push(chunk);
                }).on('end', function() {
                    body = Buffer.concat(body).toString();
                    var json = JSON.parse(body);
                    res.end(json + " World!");
                });
            });
            server.listen(port);
            var targetFileName = path.join(os.tmpdir(), 'temp-target-list');
            afterEach(_.once(fs.unlink.bind(fs, targetFileName)));
            test.createNetwork({
                balancer: "rdf-components/load-balancer"
            }).then(function(network){
                test.onOutPortData(network.processes.balancer.component, 'output', done);
                fs.writeFile(targetFileName, "http://localhost:" + port + "/", function(){
                    process.env['target-list-file'] = targetFileName;
                    network.graph.addInitial('target-list-file', 'balancer', 'target_list_file_env');
                    network.graph.addInitial("Hello", 'balancer', 'input');
                });
            }).catch(fail);
        }).should.eventually.have.property('data', "Hello World!");
    });
    it("should distribute to multiple targets", function() {
	this.timeout(3000);
        return new Promise(function(done, fail){
            var server = http.createServer();
            afterEach(_.once(server.close.bind(server)));
            var count = 0;
            var hash = {};
            server.on('request', function(req, res) {
                var body = [];
                req.on('data', function(chunk) {
                    body.push(chunk);
                }).on('end', function() {
                    body = Buffer.concat(body).toString();
                    var json = JSON.parse(body);
                    hash[req.url] = hash[req.url] || [];
                    hash[req.url].push(json);
                    res.end("Accepted");
                    if (++count > 3) done(hash);
                });
            });
            server.listen(port);
            var targetFileName = path.join(os.tmpdir(), 'temp-target-list');
            afterEach(_.once(fs.unlink.bind(fs, targetFileName)));
            test.createNetwork({
                balancer: "rdf-components/load-balancer"
            }).then(function(network){
                var list = [
                    "http://localhost:" + port + "/one",
                    "http://localhost:" + port + "/two",
                    "http://localhost:" + port + "/three",
                    "http://localhost:" + port + "/four",
                    "http://localhost:" + port + "/five"
                ];
                fs.writeFile(targetFileName, list.join('\n'), function(){
                    process.env['target-list-file'] = targetFileName;
                    network.graph.addInitial('target-list-file', 'balancer', 'target_list_file_env');
                    // load-balancer uses a hash algorithm to determine target,
                    // so the same input (and the same number of targets) will always go to the same place
                    network.graph.addInitial({vnid:"A",data:"A"}, 'balancer', 'input');
                    network.graph.addInitial({vnid:"B",data:"B"}, 'balancer', 'input');
                    network.graph.addInitial({vnid:"C",data:"C"}, 'balancer', 'input');
                    network.graph.addInitial({vnid:"D",data:"D"}, 'balancer', 'input');
                });
            }).catch(fail);
        }).should.eventually.have.all.keys("/one", "/three", "/four", "/five");
    });
});
