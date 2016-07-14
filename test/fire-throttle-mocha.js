// fire-throttle-mocha.js
// fire-throttle graph tests 

var chai = require('chai');
var should = chai.should();

var http = require('http');

var test = require('./common-test');
var factory = require('../components/throttle-fire');

describe('fire-throttle', function() {

    it("should fire off the throttle size in a noflo network", function() {

        var testPort = 1339;
        var testSize = 100;

        return test.createNetwork({
             throttler: 'rdf-components/fire-throttle' 

        }).then(function(network) {

            var throttler = network.processes.throttler.component;

            return new Promise(function(done, fail) {

                test.onOutPortData(throttler, 'output', done);

                // set initial data for the fire-throttle component
                network.graph.addInitial(testPort, 'throttler', 'listen');
                network.graph.addInitial(testSize, 'throttler', 'throttle_size');
                var req = http.request({ method: 'POST',
                                         port: testPort,
                                         path: '/' });
                req.write("If we couldn't laugh, we would all go insane.");
                req.end();

            }).then(function(done) {
                done.should.be.an('object');
                test.verifyState(done, '', testSize);
            });

        }); 

    });
});
