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
        node.profiler.should.have.all.keys('metrics', 
                                           'startEvent', 'stopEvent',
                                           'startUpdate', 'stopUpdate' );

        node.profiler.metrics.should.be.an('object');
        node.profiler.startEvent.should.be.a('function');
        node.profiler.stopEvent.should.be.a('function');
        node.profiler.startUpdate.should.be.a('function');
        node.profiler.stopUpdate.should.be.a('function');

	node.profiler.metrics.should.have.all.keys('numberOfUpdates', 'averageUpdateTime', 'totalUpdateTime',
                                                   'numberOfErrors', 'averageErrorTime', 'totalErrorTime',
                                                   'numberOfEvents', 'averageEventTime', 'totalEventTime',
                                                   'startTime', 'totalProcessingTime');
        var metrics = node.profiler.metrics;
        metrics.numberOfUpdates.should.equal(0);
        metrics.averageUpdateTime.should.equal(0);
        metrics.totalUpdateTime.should.equal(0); 
        metrics.numberOfErrors.should.equal(0);
        metrics.averageErrorTime.should.equal(0);
        metrics.totalErrorTime.should.equal(0);
        metrics.numberOfEvents.should.equal(0);
        metrics.averageEventTime.should.equal(0);
        metrics.totalEventTime.should.equal(0);
        metrics.startTime.should.be.at.least(start);
        metrics.totalProcessingTime.should.equal(0);
    });

    describe("#updateStart & updateStop", function() {

        it("should update updater success metrics", function(done) {

            var node = {componentName: "TestComponentName", nodeName: "TestNodeName"};
            profiler(node);
	    node.profiler.should.be.an('object');
	    node.profiler.startUpdate.should.be.a('function');
	    node.profiler.stopUpdate.should.be.a('function');

            // Start update & wait a bit so we have a difference in the times
            var updateStart = node.profiler.startUpdate();
            var delay = 10;
            setTimeout(function() { 
                node.profiler.stopUpdate(updateStart, false);  

                // Check the metrics match what we expect
                var metrics = node.profiler.metrics;
                metrics.numberOfUpdates.should.equal(1);
                metrics.averageUpdateTime.should.be.at.least(delay);
                metrics.totalUpdateTime.should.be.at.least(delay);

                metrics.numberOfErrors.should.equal(0);
                metrics.averageErrorTime.should.equal(0);
                metrics.totalErrorTime.should.equal(0);

                metrics.numberOfEvents.should.equal(0);
                metrics.averageEventTime.should.equal(0);
                metrics.totalEventTime.should.equal(0);

                metrics.totalProcessingTime.should.be.at.least(delay);
                metrics.averageUpdateTime.should.equal(metrics.totalUpdateTime);
                done();
            }, delay);
        });

        it("should update error metrics", function(done) {

            var node = {componentName: "TestComponentName", nodeName: "TestNodeName"};

            profiler(node);
	    node.profiler.should.be.an('object');
	    node.profiler.startUpdate.should.be.a('function');
	    node.profiler.stopUpdate.should.be.a('function');
            var updateStart = node.profiler.startUpdate();

            var delay = 5;
            setTimeout(function() {
                node.profiler.stopUpdate(updateStart, true);

                // Check the metrics match what we expect
                var metrics = node.profiler.metrics;
                metrics.numberOfErrors.should.equal(1);
                metrics.averageErrorTime.should.be.at.least(delay);
                metrics.totalErrorTime.should.be.at.least(delay);

                metrics.numberOfEvents.should.equal(0);
                metrics.averageEventTime.should.equal(0);
                metrics.totalEventTime.should.equal(0);

                metrics.numberOfUpdates.should.equal(0);
                metrics.averageUpdateTime.should.equal(0);
                metrics.totalUpdateTime.should.equal(0);

                metrics.totalProcessingTime.should.be.at.least(delay);
                done();
            }, delay);
        });

    });

    describe("#eventStart & eventStop", function() {

        it("should update event metrics", function(done) {

            var node = {componentName: "TestComponentName", nodeName: "TestNodeName"};

            profiler(node);
	    node.profiler.should.be.an('object');
	    node.profiler.startEvent.should.be.a('function');
	    node.profiler.stopEvent.should.be.a('function');
            var eventStart = node.profiler.startEvent();

            var delay = 5;
            setTimeout(function() {
                node.profiler.stopEvent(eventStart);

                // Check the metrics match what we expect
                var metrics = node.profiler.metrics;

                metrics.numberOfEvents.should.equal(1);
                metrics.averageEventTime.should.be.at.least(delay);
                metrics.totalEventTime.should.be.at.least(delay);

                metrics.numberOfUpdates.should.equal(0);
                metrics.averageUpdateTime.should.equal(0);
                metrics.totalUpdateTime.should.equal(0);

                metrics.numberOfErrors.should.equal(0);
                metrics.averageErrorTime.should.equal(0);
                metrics.totalErrorTime.should.equal(0);

                metrics.totalProcessingTime.should.be.at.least(delay);
                done();
            }, delay);
        });
    });

    describe("Functional Tests", function() {

        it("should be accessible in a component updater", function() {

           var updater = function(input) {
               var nodeInstance = this.nodeInstance;
               nodeInstance.profiler.should.be.an('object');
               nodeInstance.profiler.should.have.all.keys('metrics', 
                                                  'startEvent', 'stopEvent',
                                                  'startUpdate', 'stopUpdate' );
               nodeInstance.profiler.metrics.should.be.an('object');
               nodeInstance.profiler.startEvent.should.be.a('function');
               nodeInstance.profiler.stopEvent.should.be.a('function');
               nodeInstance.profiler.startUpdate.should.be.a('function');
               nodeInstance.profiler.stopUpdate.should.be.a('function');
               return 'success';
           };

           var node = test.createComponent(jswrapper(updater));

           return new Promise(function(done) {
               test.onOutPortData(node, 'output', done);
               test.sendData(node, 'input', "test input to log");

           }).then(function(done) {
               done.data.should.equal('success');
               var metrics = node.profiler.metrics;
               metrics.numberOfEvents.should.equal(1);
               metrics.averageEventTime.should.be.at.least(0);
               metrics.totalEventTime.should.equal(metrics.averageEventTime);

               metrics.numberOfUpdates.should.equal(1);
               metrics.averageUpdateTime.should.be.at.least(1);
               metrics.totalUpdateTime.should.equal(metrics.averageUpdateTime);

               metrics.numberOfErrors.should.equal(0);
               metrics.averageErrorTime.should.equal(0);
               metrics.totalErrorTime.should.equal(0);

               metrics.totalProcessingTime.should.equal(metrics.totalEventTime+metrics.totalUpdateTime);
           });
        });
    });
});

