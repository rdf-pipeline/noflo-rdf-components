// fire-throttle-mocha.js
// fire-throttle graph tests 

var chai = require('chai');
var should = chai.should();

var http = require('http');

var test = require('./common-test');

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

                // Send the port to listen on 
                network.graph.addInitial(testPort, 'throttler', 'listen');

                // Post a message to the port
                var req = http.request({ method: 'POST',
                                         port: testPort,
                                         path: '/' });
                req.write("If we couldn't laugh, we would all go insane.");
                req.end();

            }).then(function(done) {
                // verify we got a value of 1 back from the graph
                done.should.equal('1'); 
            });

        }); 

    });
});
