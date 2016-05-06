// id-mapper-mocha.js

var chai = require('chai');

var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

var _ = require('underscore');

var test = require('./common-test');
var compFactory = require('../components/id-mapper');

describe('id-mapper', function() {

    it('should exist as a function', function() {
        compFactory.should.exist;
        compFactory.should.be.a('function');
    });

    it('should instantiate a noflo component', function() {

        var node = test.createComponent(compFactory);
        node.should.be.an('object'); 
        node.should.include.keys('nodeName', 'componentName', 'outPorts', 'inPorts', 'vni', 'vnis');
    }); 

    describe('#updater', function() {

        it('should throw an error if id is undefined', function() {
            expect(compFactory.updater.bind(this, undefined)).to.throw(Error, 
                /Id-mapper component requires an id to map!/);
        }); 

        it('should throw an error if map is undefined', function() {
            expect(compFactory.updater.bind(this, "1")).to.throw(Error, 
                /Id-mapper component cannot map ids with an undefined or empty map!/);
        }); 

        it('should throw an error if map is empty', function() {
            expect(compFactory.updater.bind(this, 1, [])).to.throw(Error, 
                /Id-mapper component cannot map ids with an undefined or empty map!/);
        }); 

        it('should throw an error if id is not in the map', function() {
            expect(compFactory.updater.bind(this, 100, {"1":"10","2":"20","3":"30"})).to.throw(Error, 
                /Id-mapper did not find id "100" in the map!/);
        }); 

        it('should return the correct value with a single element map', function() {
            var result = compFactory.updater(1, {1:10});
            result.should.equal(10);
        }); 

	it('should return the correct value with a multi element map', function() {
            var result = compFactory.updater(2, {"1":"10","2":"20","3":"30"});
            result.should.equal('20');
        }); 

        it('should return the correct value with a JSON string of the map', function() {
            var result = compFactory.updater(3, '{"1":"10","2":"20","3":"30"}');
            result.should.equal('30');
        }); 
   });


   describe('functional behavior', function() {
       it('should map ids in a noflo network', function() {
           return test.createNetwork(
                { node1: 'strings/ParseJson',
                  node2: { getComponent: compFactory }
            }).then(function(network) {

                return new Promise(function(done, fail) {

                    // True noflo component - not facade
                    var node1 = network.processes.node1.component;
                    var node2 = network.processes.node2.component;

                    test.onOutPortData(node2, 'output', done);
                    test.onOutPortData(node2, 'error', fail);

                    network.graph.addEdge('node1', 'out', 'node2', 'map');

                    network.graph.addInitial('{"1":"10", "2":"20", "3":"30"}', 'node1', 'in');
		    network.graph.addInitial('1', 'node2', 'id');

                }).then(function(done) {

                    done.should.exist;
                    done.should.not.be.empty;
                    done.should.be.an('object');

                    done.should.have.all.keys('vnid','data','lm','stale','error');
                    done.vnid.should.equal('');
                    expect(done.data).to.equal('10');
                    expect(done.error).to.be.undefined;
                    expect(done.stale).to.be.undefined;
                    done.lm.match(/^LM(\d+)\.(\d+)$/).should.have.length(3);

                }, function(fail) {
                    console.log('fail: ',fail);
                    assert.fail(fail);
                });
           });
       }); 
   });
});
