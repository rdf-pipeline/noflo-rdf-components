// jsupdater-behaviour-mocha.js

var chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
var sinon = require('sinon');

var noflo = require('noflo');
var test = require('./common-test');
var jswrapper = require('../src/javascript-wrapper');

/**
 * Theses test are intented to verify the state management of the system.
 * @see https://github.com/rdf-pipeline/noflo-rdf-pipeline/issues/35
 */
describe("jsupdater-behaviour", function() {
    it("should fire updater when it has valid input states on all of its attached inputs", function() {
        return new Promise(function(done, fail){
            return test.createNetwork({
                node1: "core/Repeat",
                node2: "core/Repeat",
                sut: jswrapper(function(input1, input2) {
                    return "Hello " + input1 + " and " + input2;
                })
            }).then(function(network){
                network.graph.addEdge('node1', 'out', 'sut', 'input1');
                network.graph.addEdge('node2', 'out', 'sut', 'input2');
                test.onOutPortData(network.processes.sut.component, 'error', fail);
                test.onOutPortData(network.processes.sut.component, 'output', done);
                test.sendData(network.processes.node1.component, 'in', "from node1");
                test.sendData(network.processes.node2.component, 'in', "from node2");
            });
        }).should.eventually.have.property('data', "Hello from node1 and from node2");
    });
    it("should not fire updater if not all of its attached inputs have valid states", function() {
        return new Promise(function(done, fail){
            return test.createNetwork({
                node1: "core/Repeat",
                node2: "core/Repeat",
                sut: jswrapper(function(input1, input2) {
                    fail("Hello " + input1 + " and " + input2);
                })
            }).then(function(network){
                network.graph.addEdge('node1', 'out', 'sut', 'input1');
                network.graph.addEdge('node2', 'out', 'sut', 'input2');
                test.sendData(network.processes.node1.component, 'in', "from node1");
                setTimeout(done.bind(this, "nothing happened"), 100);
            }).catch(fail);
        }).should.become("nothing happened");
    });
    it("should not fire updater if upstream updater did not produce an output state", function() {
        return new Promise(function(done, fail){
            test.createNetwork({
                sink: jswrapper(function(input) {
                    // do nothing
                }),
                sut: jswrapper(function(input) {
                    fail("Hello " + input);
                })
            }).then(function(network){
                network.graph.addEdge('sink', 'output', 'sut', 'input');
                test.sendData(network.processes.sink.component, 'input', "tongue");
                setTimeout(done.bind(this, "nothing happened"), 100);
            }).catch(fail);
        }).should.become("nothing happened");
    });
    it("should not fire updater if upstream updater did not produce an output state after producing one", function() {
        return new Promise(function(done, fail){
            var count = 0;
            test.createNetwork({
                once: jswrapper(function(input) {
                    switch(++count) {
                        case 1: return input;
                    }
                }),
                sut: jswrapper(function(input) {
                    return "Hello " + input;
                })
            }).then(function(network){
                network.graph.addEdge('once', 'output', 'sut', 'input');
                return new Promise(function(adv) {
                    test.onOutPortData(network.processes.sut.component, 'output', adv);
                    test.sendData(network.processes.once.component, 'input', "once");
                }).then(function() {
                    test.onOutPortData(network.processes.sut.component, 'output', fail);
                    test.sendData(network.processes.once.component, 'input', "again");
                    setTimeout(done.bind(this, "nothing happened"), 100);
                });
            }).catch(fail);
        }).should.become("nothing happened");
    });
    it("should not fire updater if upstream updater set an error", function() {
        return new Promise(function(done, fail){
            return test.createNetwork({
                broken: jswrapper(function(input) {
                    this.outputState().error = true;
                }),
                sut: jswrapper(function(input) {
                    fail("Hello " + input);
                })
            }).then(function(network){
                network.graph.addEdge('broken', 'output', 'sut', 'input');
                test.sendData(network.processes.broken.component, 'input', "brake");
                setTimeout(done.bind(this, "nothing happened"), 100);
            });
        }).should.become("nothing happened");
    });
    it("should not fire updater if upstream updater threw an error", function() {
        return new Promise(function(done, fail){
            return test.createNetwork({
                broken: jswrapper(function(input) {
                    throw Error(input);
                }),
                sut: jswrapper(function(input) {
                    fail("Hello " + input);
                })
            }).then(function(network){
                network.graph.addEdge('broken', 'output', 'sut', 'input');
                test.sendData(network.processes.broken.component, 'input', "brake");
                setTimeout(done.bind(this, "nothing happened"), 100);
            });
        }).should.become("nothing happened");
    });
    it("should notify attached error port if an updater explicity sets error", function() {
        return new Promise(function(done, fail){
            return test.createNetwork({
                broken: jswrapper(function(input) {
                    var errorState = this.errorState();
                    errorState.data = input;
                    this.errorState( errorState );
                }),
                sut: jswrapper(function(input) {
                    return "Hello " + input;
                })
            }).then(function(network){
                network.graph.addEdge('broken', 'error', 'sut', 'input');
                test.sendData(network.processes.broken.component, 'input', "from broken");
                test.onOutPortData(network.processes.sut.component, 'output', done);
                test.onOutPortData(network.processes.sut.component, 'error', fail);
            });
        }).should.eventually.have.property('data', "Hello from broken");
    });
    it("should fire updater if upstream updater changed output state", function() {
        return new Promise(function(done, fail){
            test.createNetwork({
                once: jswrapper(function(input) {
                    return input;
                }),
                sut: jswrapper(function(input) {
                    return "Hello " + input;
                })
            }).then(function(network){
                network.graph.addEdge('once', 'output', 'sut', 'input');
                return new Promise(function(adv) {
                    test.onOutPortData(network.processes.sut.component, 'output', adv);
                    test.sendData(network.processes.once.component, 'input', "once");
                }).then(function() {
                    test.onOutPortData(network.processes.sut.component, 'output', done);
                    test.sendData(network.processes.once.component, 'input', "again");
                });
            }).catch(fail);
        }).should.eventually.have.property('data', "Hello again");
    });
    it("should fire updater if upstream updater changed output state lm", function() {
        return new Promise(function(done, fail){
            var count = 0;
            test.createNetwork({
                once: jswrapper(function(input) {
                    switch(++count) {
                        case 1: return input;
                        default:
                        var outputState = this.outputState();
                        outputState.lm = "changed";
                        this.outputState(outputState);
                    }
                }),
                sut: jswrapper(function(input) {
                    return "Hello " + input;
                })
            }).then(function(network){
                network.graph.addEdge('once', 'output', 'sut', 'input');
                return new Promise(function(adv) {
                    test.onOutPortData(network.processes.sut.component, 'output', adv);
                    test.sendData(network.processes.once.component, 'input', "once");
                }).then(function() {
                    test.onOutPortData(network.processes.sut.component, 'output', done);
                    test.sendData(network.processes.once.component, 'input', "again");
                });
            }).catch(fail);
        }).should.eventually.have.property('data', "Hello once");
    });
    it("should fire updater if upstream updater did nothing, after error, after valid output", function() {
        return new Promise(function(done, fail){
            var count = 0;
            test.createNetwork({
                upstream: jswrapper(function(input) {
                    switch(++count) {
                        case 1: return input;
                        case 2: throw input;
                    }
                }),
                sut: jswrapper(function(input) {
                    return "Hello " + input;
                })
            }).then(function(network){
                network.graph.addEdge('upstream', 'output', 'sut', 'input');
                return new Promise(function(adv) {
                    test.onOutPortData(network.processes.sut.component, 'output', adv);
                    test.sendData(network.processes.upstream.component, 'input', "upstream");
                }).then(function() {
                    return new Promise(function(adv) {
                        test.onOutPortData(network.processes.upstream.component, 'output', adv);
                        test.sendData(network.processes.upstream.component, 'input', "again");
                    });
                }).then(function() {
                    test.onOutPortData(network.processes.sut.component, 'output', done);
                    test.sendData(network.processes.upstream.component, 'input', "yet again");
                });
            }).catch(fail);
        }).should.eventually.have.property('data', "Hello upstream");
    });
    it("should not fire updater if upstream updater set an error data", function() {
        return new Promise(function(done, fail){
            return test.createNetwork({
                broken: jswrapper(function(input) {
                    var errorState = this.errorState();
                    errorState.data = input;
                    this.errorState( errorState );
                }),
                sut: jswrapper(function(input) {
                    fail("Hello " + input);
                })
            }).then(function(network){
                network.graph.addEdge('broken', 'output', 'sut', 'input');
                test.sendData(network.processes.broken.component, 'input', "brake");
                setTimeout(done.bind(this, "nothing happened"), 100);
            });
        }).should.become("nothing happened");
    });
    it("should fire error updater if upstream updater set an error data", function() {
        return new Promise(function(done, fail){
            return test.createNetwork({
                broken: jswrapper(function(input) {
                    var errorState = this.errorState();
                    errorState.data = input;
                    this.errorState( errorState );
                }),
                sut: jswrapper(function(input) {
                    done("Hello " + input);
                })
            }).then(function(network){
                network.graph.addEdge('broken', 'error', 'sut', 'input');
                test.sendData(network.processes.broken.component, 'input', "from broken");
            });
        }).should.become("Hello from broken");
    });
    it("should not notify attached error port if an updater explicity sets the same error", function() {
        return new Promise(function(done, fail){
            return test.createNetwork({
                broken: jswrapper(function(input) {
                    var errorState = this.errorState();
                    errorState.data = input;
                    this.errorState( errorState );
                }),
                sut: jswrapper(function(input) {
                    return "Hello " + input;
                })
            }).then(function(network){
                network.graph.addEdge('broken', 'error', 'sut', 'input');
                test.sendData(network.processes.broken.component, 'input', "from broken");
                var first = true;
                test.onOutPortData(network.processes.sut.component, 'output', function(output){
                    if (first) {
                        first = false;
                        test.sendData(network.processes.broken.component, 'input', "from broken");
                        setTimeout(done.bind(this, "nothing else happened"), 100);
                    } else {
                        fail(output);
                    }
                });
                test.onOutPortData(network.processes.sut.component, 'error', fail);
            });
        }).should.become("nothing else happened");
    });
    it("should log error port if nothing is attached", function() {
        return new Promise(function(done, fail){
            sinon.stub( console, 'error', function (message) {
                 done(message);
            }); 
            return test.createNetwork({
                broken: jswrapper(function(input) {
                    var errorState = this.errorState();
                    errorState.data = input;
                    this.errorState( errorState );
                })
            }).then(function(network){
                test.sendData(network.processes.broken.component, 'input', "Hello World!");
            });
        }).should.become("Hello World!").and.notify(console.error.restore.bind(console.error));
    });
});
