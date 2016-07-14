// throttle-fire-mocha.js
// throttle-fire component tests

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var test = require('./common-test');
var factory = require('../components/throttle-fire');

describe('throttle-fire', function() {

    it("should exist as a function", function() {
        factory.should.exist;
        factory.should.be.a('function');
    });

    it("should instantiate a noflo component", function() {
        var node = test.createComponent(factory);
        node.should.be.an('object');
        node.should.include.keys('nodeName', 'componentName', 'outPorts', 'inPorts', 'vni', 'vnis');
    });

    describe('#updater', function() {

        it("should throw an error if no input or throttle size was specified", function() {
            expect(factory.updater.bind(this)).to.throw(Error,
                "Throttle requires an integer throttle_size!  Received: 'undefined'");
        });

        it("should throw an error if input provided, but no throttle size was specified", function() {
            expect(factory.updater.bind(this, undefined, 'some input')).to.throw(Error,
                "Throttle requires an integer throttle_size!  Received: 'undefined'");
        });

        it("should throw an error the throttle size is not an integer or integer string", function() {
            expect(factory.updater.bind(this, "ABC")).to.throw(Error,
                /Throttle requires an integer throttle_size!  Received: 'ABC'/);
        });

        it("should return the integer value of throttle size", function() {
           // Instantiate a component and set the VNI data 
           var node = test.createComponent(factory);
           var result = factory.updater.call(node.vni(''), "1");
           result.should.not.be.empty;
           result.should.equal(1);
        });

        it("should return an integer value if the throttle size is numeric", function() {
           // Instantiate a component and set the VNI data 
           var node = test.createComponent(factory);
           var result = factory.updater.call(node.vni(''), "2.2", "Anything goes!");
           result.should.not.be.empty;
           result.should.equal(2);
        });

        it("should return an integer value if the throttle size is an integer", function() {
           // Instantiate a component and set the VNI data 
           var node = test.createComponent(factory);
           var result = factory.updater.call(node.vni(''), 3);
           result.should.not.be.empty;
           result.should.equal(3);
        });

    });

    describe('functional behavior', function() {

        it('should return throttle size in a noflo network', function() {
            this.timeout(3000);

            // Set the test throttle size we want
            var testsize = 12;

            return test.createNetwork(
                 { input: 'core/Repeat',
                   throttlesize: 'core/Repeat',
                   throttler: 'rdf-components/throttle-fire' }

           ).then(function(network) {
                var input = network.processes.input.component;
                var throttlesize = network.processes.throttlesize.component;
                var throttler = network.processes.throttler.component;

                return new Promise(function(done, fail) {

                    test.onOutPortData(throttler, 'output', done);

                    network.graph.addEdge('input', 'out', 'throttler', 'input');
                    network.graph.addEdge('throttlesize', 'out', 
                                          'throttler', 'throttle_size');

                    network.graph.addInitial('I get no kick from champagne', 
                                             'input', 'in');
                    network.graph.addInitial(testsize, 'throttlesize', 'in');

                }).then(function(done) {
                    done.should.be.an('object');
                    test.verifyState(done, '', testsize);
                });
            }); 
        });

    });
});
