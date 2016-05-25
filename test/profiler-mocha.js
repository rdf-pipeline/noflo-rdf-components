// profiler.js

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var fs = require('fs');

var test = require('./common-test');
var profiler = require('../src/profiler');
var jswrapper = require('../src/javascript-wrapper');

describe("profiler", function() {

    it("should exist as a function", function() {
        profiler.should.exist;
        profiler.should.be.a('function');
    });

    it("should instantiate a profiler", function() {
        var start = Date.now();
        var node = {componentName: "componentName", 
                    nodeName: "nodeName"};
        profiler(node);
        node.profiler.should.be.an('object');
        node.profiler.should.have.all.keys('createLog', 'metrics', 'update');

        var profile = node.profiler;
        profile.createLog.should.be.a('function');
        profile.metrics.should.be.an('object');
        profile.update.should.be.a('function');

        profile.metrics.should.have.all.keys('numberOfErrors', 'numberOfUpdates',
                                             'startTime', 'totalErrorTime', 
                                             'totalUpdateTime');
        var metrics = profile.metrics;
        metrics.numberOfErrors.should.equal(0);
        metrics.numberOfUpdates.should.equal(0);
        metrics.startTime.should.be.at.least(start);
        metrics.totalErrorTime.should.equal(0);
        metrics.totalUpdateTime.should.equal(0); 
    });

    describe("#createLog", function() {

        it("should instantiate a logger and create a log file if none exists", function() {

            var path = __dirname+'/logs';
            var filename = 'Test.log';
            var filepath = initFilePath(path, filename);

            // instantiate the profiler
            var node = {componentName: "componentName", 
                        nodeName: "nodeName"};
            profiler(node);
            var profile = node.profiler;

            // Create the logger & log file
            expect(profile.profileLog).to.not.exist;
            profile.createLog(path, filename);

            profile.profileLog.should.exist;
            profile.profileLog.should.be.an('object');

            // Write something to the log file
            var testString = 'Aloha from the logger';
            profile.profileLog.info(testString);

            // Verify log file exists and has the expected content after a second
            setTimeout(function() { 
                var data = fs.readFileSync(filepath).toString();
                data.should.contain(testString);
            }, 1000);
        });
    });

    describe("#update", function() {

        it("should update success metrics and write metric information to the log file", function(done) {
            this.timeout(2500);
            var startTime = Date.now();

            var path = __dirname+'/logs';
            var filename = 'TestSuccess.log';
            var filepath = initFilePath(path, filename);

            var node = initProfileLogging(path, filename);

            setTimeout(function() { 
                node.profiler.update(startTime,   
                                     true);  // success path

                // Check the metrics match what we expect
                var metrics = node.profiler.metrics;
                metrics.numberOfErrors.should.equal(0);
                metrics.numberOfUpdates.should.equal(1);
                metrics.totalErrorTime.should.equal(0);
                metrics.totalUpdateTime.should.be.greaterThan(0);

                // Verify log file exists and has the expected content after a half second
                setTimeout(function() { 
                    var data = fs.readFileSync(filepath).toString();
                    expect(/Update completed successfully with elapsedTime: \d+ms/.test(data)).to.be.true;
                    expect(/Average update time: \d+ms/.test(data)).to.be.true;
                    expect(/Total component elapsed time: \d+ms/.test(data)).to.be.true;
                    done();
                }, 500);
            }, 500);

        });

        it("should update error metrics and write metric information to the log file", function(done) {
            this.timeout(2500);
            var startTime = Date.now();

            var path = __dirname+'/logs';
            var filename = 'TestError.log';
            var filepath = initFilePath(path, filename);

            var node = initProfileLogging(path, filename);
            var errorMessage = 'Test writing the error details';
          
            setTimeout(function() { 
                node.profiler.update(startTime,  
                                     false,  // error path
                                     errorMessage);

                // Check the metrics match what we expect
                var metrics = node.profiler.metrics;
                metrics.numberOfErrors.should.equal(1);
                metrics.numberOfUpdates.should.equal(0);
                metrics.totalErrorTime.should.be.greaterThan(0);
                metrics.totalUpdateTime.should.equal(0);

                // Verify log file exists and has the expected content after a half second
                setTimeout(function() {
                    var data = fs.readFileSync(filepath).toString();
                    expect(/Update failed with an error - elapsedTime: \d+ms/.test(data)).to.be.true;
                    data.should.contain(errorMessage);
                    expect(/Total component elapsed time: \d+ms/.test(data)).to.be.true;
                    done();
                }, 500);
            }, 500);

        });
    });

    describe("Functional Tests", function() {

        it("should be accessible in a component updater", function() {

           var handler;
           var updater = function(input) {
               var profiler = this.nodeInstance.profiler;
               profiler.should.be.an('object');
               profiler.profileLog.should.be.an('object');
               profiler.profileLog.info(input);
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

function initFilePath(path, filename) {
    var filepath = path + '/' + filename;
    try { fs.unlinkSync(filepath); 
    } catch(e) {
        if (e.code != 'ENOENT') { 
            console.log('unable to unlink file ',filepath,e);
        }
    }
    return filepath;
}

function initProfileLogging(path, filename) {
    // instantiate the profiler
    var node = {componentName: "componentName", 
                nodeName: "nodeName"};
    profiler(node);
    node.profiler.createLog(path, filename);
    return node;
}
