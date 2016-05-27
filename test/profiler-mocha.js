// profiler.js

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var test = require('./common-test');
var profiler = require('../src/profiler');
var jswrapper = require('../src/javascript-wrapper');

describe("profiler", function() {

    it("should exist as a function", function() {
        profiler.should.exist;
        profiler.should.be.a('function');
    });

    it("should instantiate a profiler with default metrics", function() {
        var start = Date.now();

        var node = {componentName: "TestComponentName", nodeName: "TestNodeName"};
        profiler(node);
        node.profiler.should.be.an('object');
        node.profiler.should.have.all.keys('eventTypes', 'metrics', 'update');

        node.profiler.eventTypes.should.be.an('object');
        node.profiler.metrics.should.be.an('object');
        node.profiler.update.should.be.a('function');

        node.profiler.metrics.should.have.all.keys('averageUpdateTime', 'numberOfErrors', 
                                                   'numberOfEvents', 'numberOfUpdates',
                                                   'startTime', 'totalErrorTime', 
                                                   'totalProcessingTime', 'totalUpdateTime');
        var metrics = node.profiler.metrics;
        metrics.averageUpdateTime.should.equal(0);
        metrics.numberOfErrors.should.equal(0);
        metrics.numberOfEvents.should.equal(0);
        metrics.numberOfUpdates.should.equal(0);
        metrics.startTime.should.be.at.least(start);
        metrics.totalErrorTime.should.equal(0);
        metrics.totalProcessingTime.should.equal(0);
        metrics.totalUpdateTime.should.equal(0); 
    });

    describe("#update", function() {

        it("should update success metrics", function(done) {
            var startTime = Date.now();

            var node = {componentName: "TestComponentName", nodeName: "TestNodeName"};
            profiler(node);
	    node.profiler.should.be.an('object');
	    node.profiler.update.should.be.a('function');

            // Wait a bit so we have a difference in the times
            var delay = 10;
            setTimeout(function() { 
                node.profiler.update(startTime, node.profiler.eventTypes.UPDATE_SUCCESS);  

                // Check the metrics match what we expect
                var metrics = node.profiler.metrics;
                metrics.averageUpdateTime.should.be.at.least(delay);
                metrics.numberOfErrors.should.equal(0);
                metrics.numberOfEvents.should.equal(1);
                metrics.numberOfUpdates.should.equal(1);
                metrics.totalErrorTime.should.equal(0);
                metrics.totalProcessingTime.should.be.at.least(delay);
                metrics.totalUpdateTime.should.be.at.least(delay);
                metrics.averageUpdateTime.should.equal(metrics.totalUpdateTime);
                done();
            }, delay);
        });

        it("should update error metrics", function(done) {
            var startTime = Date.now();

            var node = {componentName: "TestComponentName", nodeName: "TestNodeName"};
            profiler(node);
          
            var delay = 5;
            setTimeout(function() { 
                node.profiler.update(startTime, node.profiler.eventTypes.UPDATE_ERROR);

                // Check the metrics match what we expect
                var metrics = node.profiler.metrics;
                metrics.averageUpdateTime.should.equal(0);
                metrics.numberOfErrors.should.equal(1);
                metrics.numberOfEvents.should.equal(1);
                metrics.numberOfUpdates.should.equal(0);
                metrics.totalErrorTime.should.be.at.least(delay);
                metrics.totalUpdateTime.should.equal(0);
                metrics.totalProcessingTime.should.be.at.least(delay);
                done();
            }, delay);
        });

        it("should update event metrics", function(done) {
            var startTime = Date.now();

            var node = {componentName: "TestComponentName", nodeName: "TestNodeName"};
            profiler(node);
          
            var delay = 3;
            setTimeout(function() { 
                node.profiler.update(startTime, node.profiler.eventTypes.ONDATA_EVENT);

                // Check the metrics match what we expect
                var metrics = node.profiler.metrics;
                metrics.averageUpdateTime.should.equal(0);
                metrics.numberOfErrors.should.equal(0);
                metrics.numberOfEvents.should.equal(1);
                metrics.numberOfUpdates.should.equal(0);
                metrics.totalErrorTime.should.equal(0);
                metrics.totalUpdateTime.should.equal(0);
                metrics.totalProcessingTime.should.be.at.least(delay);
                done();
            }, delay);
        });
    });

    describe("Functional Tests", function() {

        it("should be accessible in a component updater", function() {

           var handler;
           var updater = function(input) {
               this.nodeInstance.profiler.should.be.an('object');
               this.nodeInstance.profiler.should.have.all.keys('eventTypes', 'metrics', 'update');
               this.nodeInstance.profiler.eventTypes.should.be.an('object');
               this.nodeInstance.profiler.metrics.should.be.an('object');
               this.nodeInstance.profiler.update.should.be.a('function');
               handler('success');
           };

           var node = test.createComponent(jswrapper(updater));

           return new Promise(function(callback){
               handler = callback;
               test.sendData(node, 'input', "test input to log");
           }).then(function(done) {
               done.should.equal('success');
           });
        });
    });
});

