// html-2-objects-compare-mocha.js

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var expect = chai.expect;
chai.should();
chai.use(chaiAsPromised);

var _ = require('underscore');
var fs = require('fs');
var noflo = require('noflo');

var componentFactory = require('../components/html-2-objects-compare');
var getComponent = componentFactory.getComponent;

var commonTest = require('./common-test');

describe('html-2-objects-compare', function() {

    it("should have a component definition with expected input & output ports", function() {
        return Promise.resolve(componentFactory.getComponent )
            .then(commonTest.createComponent).then(function(component){

                 component.should.be.an.instanceof(noflo.Component);

                 // Verify we have a good inPorts object with our 3 input ports: file, left, & right
                 component.inPorts.should.exist;
                 component.inPorts.should.be.an('object');
                 component.inPorts.ports.should.exist;
                 component.inPorts.ports.should.be.an('object');
                 component.inPorts.ports.file.should.exist;
                 component.inPorts.ports.file.should.be.an('object');
                 component.inPorts.ports.left.should.exist;
                 component.inPorts.ports.left.should.be.an('object');
                 component.inPorts.ports.right.should.exist;
                 component.inPorts.ports.right.should.be.an('object');

                 // Verify we have a good outPorts with 2 output ports: output & error
                 component.outPorts.should.exist;
                 component.outPorts.should.be.an('object');
                 component.outPorts.ports.should.exist;
                 component.outPorts.ports.should.be.an('object');
                 component.outPorts.ports.output.should.exist;
                 component.outPorts.ports.output.should.be.an('object');
                 component.outPorts.ports.error.should.exist;
                 component.outPorts.ports.error.should.be.an('object');
        });
    });

    it("should  generate the correct comparison file when called with good input data", function() {
        return Promise.resolve(componentFactory.getComponent )
            .then(commonTest.createComponent).then(function(component){

               var filePath = 'test/data/comparison.html';
               var expectedFilePath = 'test/data/expected-comparison.html';

               // remove the target file if it exists so we create it again clean
               try { fs.unlinkSync(filePath); 
               } catch (e) { /* do nothing - will fail if file does not exist */ }

               commonTest.sendData( component, 'file',
                                    filePath);
               commonTest.sendData( component,'left',
                                    {title:"Left Column"});
               commonTest.sendData( component,'left',
                                    {id: '001',  glucose: '75',  date: '2012-02-01'});
               commonTest.sendData( component,'right',
                                    {title:"Right Column"});
               commonTest.sendData( component,'right',
                                    {patientId: '001', 'fasting-glucose': '75', date: '2012-02-01'});

               // Now verify that we got the expected file output.  We'll do 
               // this by comparing the expected file against the file we actually got
               var expectedStats = fs.stat(expectedFilePath); 
               fs.stat(filePath, function(error, stats) {

                   stats.should.not.be.empty;
                   stats.should.deep.equal( expectedStats );

                   var expected_fd = fs.open(expectedfilePath, 'r');
                   fs.open(filePath, 'r', function(error, fd) {

                       var buf = new Buffer(stats.size);
                       var expectedBuf = new Buffer(stats.size);
                  
                       fs.read(fd, expectedBuf, 0, expectedBuf.length);
                       fs.read(fd, buf, 0, buf.length, null, function(error, bytesRead, buf) {
                           var data = buf.toString('utf8', 0, buf.length).replace(/\r?\n|\r/,'');
                           var expectedData = expectedBuf.toString('utf8', 0, expectedBuf.length).replace(/\r?\n|\r/,'');
                           data.should.equal( expectedData );
                       });

                       fs.close(fd);
                   });
               });
        }); 
    });

    it("should fail when called with no title", function() {
        return Promise.resolve(componentFactory.getComponent )
            .then(commonTest.createComponent).then( function(component){

               var filePath = 'test/data/comparison.html';

               // Send data, but with no title 
               commonTest.sendData( component, 'file',
                                    filePath);
               commonTest.sendData( component,'left',
                                    "Left Column With No Title");
               commonTest.sendData( component,'left',
                                    {id: '001',  glucose: '75',  date: '2012-02-01'});
               commonTest.sendData( component,'right',
                                    {title:"Right Column"});
               commonTest.sendData( component,'right',
                                    {patientId: '001', 'fasting-glucose': '75', date: '2012-02-01'});
            }).should.be.rejectedWith(Error, /Invalid input.  Missing the title setting on port left./);
    });


});
