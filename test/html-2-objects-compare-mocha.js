// html-2-objects-compare-mocha.js

var chai = require('chai');

var assert = chai.assert;
var expect = chai.expect;
chai.should();

var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

var _ = require('underscore');
var fs = require('fs');

var createState = require('../src/create-state');
var factory = require('../components/html-2-objects-compare');
var getComponent = factory.getComponent;

var commonTest = require('./common-test');

describe('html-2-objects-compare', function() {

    it("should have have the expected node facade", function() {
        var node = commonTest.createComponent(factory);

        node.should.be.an('object');
        node.should.include.keys('nodeName', 'componentName', 'inPorts', 'outPorts',
                                   'deleteAllVnis', 'deleteVni', 'vni', 'vnis');

        node.inPorts.should.be.an('object');
        node.outPorts.should.be.an('object');

        node.deleteAllVnis.should.be.a('function');
        node.deleteVni.should.be.a('function');
        node.vni.should.be.a('function');
        node.vnis.should.be.an('object');
    });

    it("should have have expected input & output ports", function() {
        var node = commonTest.createComponent(factory);

        node.inPorts.should.be.an('object');
        node.inPorts.should.have.all.keys('file', 'left', 'right');
        node.inPorts.file.should.be.an('object');
        node.inPorts.left.should.be.an('object');
        node.inPorts.right.should.be.an('object');

        node.outPorts.should.be.an('object');
        node.outPorts.should.have.all.keys('output', 'error');
        node.outPorts.output.should.be.an('object');
        node.outPorts.error.should.be.an('object');
    });

    it("should  generate the correct comparison file when called with good input data", function() {

        var filePath = 'test/data/comparison.html';
        var expectedFilePath = 'test/data/expected-comparison.html';

        // remove the target file if it exists so we create it again clean
        try { fs.unlinkSync(filePath); 
        } catch (e) { /* do nothing - will fail if file does not exist */ }

        return commonTest.createNetwork(
            { node1: 'core/Repeat', 
              node2: 'core/Repeat', 
              node3: 'core/Repeat', 
              node4: 'core/Repeat', 
              node5: 'core/Repeat', 
              node6: { getComponent: factory }
        }).then(function(network) {

            return new Promise(function(done, fail) {

                // True noflo component - not facade
                var node = network.processes.node6.component;

                commonTest.onOutPortData(node, 'output', done);
                commonTest.onOutPortData(node, 'error', fail);

                network.graph.addEdge('node1', 'out', 'node6', 'file');
                network.graph.addEdge('node2', 'out', 'node6', 'left');
                network.graph.addEdge('node3', 'out', 'node6', 'left');
                network.graph.addEdge('node4', 'out', 'node6', 'right');
                network.graph.addEdge('node5', 'out', 'node6', 'right');

                network.graph.addInitial(filePath, 'node1', 'in');

                network.graph.addInitial({title:"Left Column"}, 'node2', 'in');
                network.graph.addInitial(createState('001', {id: '001',  glucose: '75',  date: '2012-02-01'}), 
                                          'node3', 'in');

                network.graph.addInitial({title:"Right Column"}, 'node4', 'in');
                network.graph.addInitial(createState('001', {patientId: '001', 'fasting-glucose': '75', date: '2012-02-01'}),
                                          'node5', 'in');

            }).then(function(done) {

                // verify we got the output state we expect

                done.vnid.should.equal('001');
                expect(done.error).to.be.undefined;

                // Now verify that we got the expected file output.  We'll do 
                // this by comparing the expected file against the file we actually got
                var expectedStats = fs.stat(expectedFilePath); 
                fs.stat(filePath, function(error, stats) {

                    stats.should.not.be.empty;
                    stats.should.deep.equal(expectedStats);

                    var expected_fd = fs.open(expectedfilePath, 'r');
                    fs.open(filePath, 'r', function(error, fd) {
    
                        var buf = new Buffer(stats.size);
                        var expectedBuf = new Buffer(stats.size);
                   
                        fs.read(fd, expectedBuf, 0, expectedBuf.length);
                        fs.read(fd, buf, 0, buf.length, null, function(error, bytesRead, buf) {
                            var data = buf.toString('utf8', 0, buf.length).replace(/\r?\n|\r/,'');
                            var expectedData = expectedBuf.toString('utf8', 0, expectedBuf.length).replace(/\r?\n|\r/,'');
                            data.should.equal(expectedData);
                        });

                        fs.close(fd);
                    });
                });
            });  
        }); 

    });

    it("should fail when called with no title", function() {

        return commonTest.createNetwork(
            { node1: 'core/Repeat', 
              node2: 'core/Repeat', 
              node3: 'core/Repeat', 
              node4: 'core/Repeat', 
              node5: 'core/Repeat', 
              node6: { getComponent: factory }
        }).then(function(network) {

            return new Promise(function(done, fail) {

                // True noflo component - not facade
                var node = network.processes.node6.component;

                commonTest.onOutPortData(node, 'output', done);
                commonTest.onOutPortData(node, 'error', fail);

                network.graph.addEdge('node1', 'out', 'node6', 'file');
                network.graph.addEdge('node2', 'out', 'node6', 'left');
                network.graph.addEdge('node3', 'out', 'node6', 'left');
                network.graph.addEdge('node4', 'out', 'node6', 'right');
                network.graph.addEdge('node5', 'out', 'node6', 'right');

                network.graph.addInitial('test/data/comparison.html', 'node1', 'in');

                network.graph.addInitial("Left Column No Title", 'node2', 'in');
                network.graph.addInitial(createState('001', {id: '001',  glucose: '75',  date: '2012-02-01'}), 
                                          'node3', 'in');

                network.graph.addInitial({title:"Right Column"}, 'node4', 'in');
                network.graph.addInitial(createState('001', {patientId: '001', 'fasting-glucose': '75', date: '2012-02-01'}),
                                          'node5', 'in');

            }).then(function(done) {

               // verify we got the output state we expect
               done.vnid.should.equal('001');
               expect(done.data).to.be.undefined;
               done.error.should.be.true;
            });  
        }); 
    });

});
