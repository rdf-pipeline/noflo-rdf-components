/**
 * File: input-state-mocha.js
 * Unit tests for the input-state APIs defined in src/input-state.js
 */

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var _ = require('underscore');
var componentFactory = require('../src/noflo-component-factory');
var access = require('../src/noflo-component-access');
var test = require('./common-test');
var inputStates = require('../src/input-states');
var createLm = require('../src/create-lm');

describe('input-states', function() {
    var component, network;
    var oninput, onoutput;
    beforeEach(function(){
        var getComponent = function() {
            var factory = componentFactory({
                inPorts:{
                    input:{
                        ondata: function(payload) {
                            oninput(payload);
                        }
                    },
                    input1:{
                        ondata: function(payload) {
                            oninput(payload);
                        }
                    },
                    input2:{
                        ondata: function(payload) {
                            oninput(payload);
                        }
                    },
                    input3:{
                        ondata: function(payload) {
                            oninput(payload);
                        }
                    },
                    inputa:{
                        addressable: true,
                        ondata: function(payload) {
                            oninput(payload);
                        }
                    },
                    inputb:{
                        addressable: true,
                        ondata: function(payload) {
                            oninput(payload);
                        }
                    }
                },
                outPorts:{
                    output:{
                        ondata: function(payload) {
                            onoutput(payload);
                        }
                    }
                }
            });
            var component = factory();
            var facade = access(component);
            _.extend(facade, {
                vni: function(vnid) {
                    return {
                        inputStates: _.partial(inputStates, facade, vnid || '')
                    };
                }
            });
            return component;
        };
        oninput = onoutput = _.noop;
        return test.createNetwork({
            upstream1: {
                getComponent: componentFactory({
                    outPorts:{
                        output:{}
                    }
                })
            },
            upstream2: {
                getComponent: componentFactory({
                    outPorts:{
                        output:{}
                    }
                })
            },
            test: {
                getComponent: getComponent
            }
        }).then(function(network){
            network.graph.addEdge('upstream1', 'output', 'test', 'input');
            network.graph.addEdge('upstream1', 'output', 'test', 'inputa');
            network.graph.addEdge('upstream1', 'output', 'test', 'inputb');
            network.graph.addEdge('upstream2', 'output', 'test', 'input');
            network.graph.addEdge('upstream2', 'output', 'test', 'inputa');
            network.graph.addEdge('upstream2', 'output', 'test', 'inputb');
            return network;
        }).then(function(nw){
            network = nw;
            component = access(nw.processes.test.component);
        });
    });
    afterEach(function(){
        network.stop();
    });
    it('should exist as a function', function() {
        component.vni().inputStates.should.be.a('function');
    });
    it('should fail if vnid is not a string', function() {
        expect(function(){return component.vni(-1).inputStates('input');}).to.throw(Error);
    });
    it('should fail if invalid port name', function() {
        expect(function(){return component.vni().inputStates('bogus');}).to.throw(Error);
    });
    it('should fail if not addressable', function() {
        expect(function(){return component.vni().inputStates('input', 0);}).to.throw(Error);
        expect(function(){return component.vni().inputStates('input', 0, {});}).to.throw(Error);
        expect(function(){return component.vni().inputStates('input', []);}).to.throw(Error);
        expect(function(){return component.vni().inputStates('input', 'upstream1', 'output', {});}).to.throw(Error);
        expect(function(){return component.vni().inputStates('input', 'upstream1', 'output');}).to.throw(Error);
    });
    it('should fail if too many parameters', function() {
        expect(function(){return component.vni().inputStates('input', 'upstream1', 'output', undefined, undefined);}).to.throw(Error);
    });
    it('should fail if no upstream node', function() {
        expect(function(){return component.vni().inputStates('inputa', 'bogus', 'output');}).to.throw(Error);
    });
    it('should return undefined when no state exists', function() {
        expect(component.vni().inputStates('input') ).to.be.undefined;
        expect(component.vni().inputStates('inputa', 0) ).to.be.undefined;
    });
    it('should list all ports', function() {
        component.vni().inputStates().should.have.all.keys(_.keys(component.inPorts));
    });
    it('should set and get a new IIP input state', function() {
        var state = { vnid: '001',
                   data: 'hello world',
                   lm: createLm() }

        var context = component.vni().inputStates('input', state );
        context.should.exist;

        var result = component.vni().inputStates('input'); 
        verifyInputState( result, state );
    });
    it('should fallback to no vnid', function() {
        var state = { vnid: '001',
                   data: 'hello world',
                   lm: createLm() }

        var context = component.vni().inputStates('input', state );
        context.should.exist;

        var result = component.vni('001').inputStates('input'); 
        verifyInputState( result, state );
    });
    it('should set and get a new IIP input state hash', function() {
        var state = { vnid: '001',
                   data: 'hello world',
                   lm: createLm() }

        var context = component.vni().inputStates({input: state});
        context.should.exist;

        var result = component.vni().inputStates('input'); 
        verifyInputState( result, state );
    });
    it('should update an IIP input state', function() {
         var state = { vnid: '002',
                       data: 'Hola Mundo',
                       lm: createLm() };

         var context = component.vni().inputStates('input', state);
         context.should.exist;

         var result = component.vni().inputStates('input'); 
         verifyInputState( result, state );

         var state2 = { vnid: '003',
                        data: 'Bonjour le monde',
                        lm: createLm() };
         var context2 = component.vni().inputStates('input', state2);
         context2.should.exist;

         var result2 = component.vni().inputStates('input'); 
         verifyInputState( result2, state2 );
    });
    it('should set many IIP input states', function() {
          var inStates = [];
          var inPortInfo;
          var inState;

          for ( var i=2; i < 4; i++ ) {
               inPortInfo = { inportName: 'input'+i };
               inState = { vnid: Number(i).toString(),
                           data: 'data' + i,
                           lm: createLm() };
               component.vni().inputStates('input'+i, inState);
               inStates.push( { portInfo: inPortInfo, state: inState } ); 
          } 

          // Tack one onto the front 
          inPortInfo = { inportName: 'input' };
          inState = { vnid: 99,
                      data: 'alpha data',
                      lm: createLm() };
          component.vni().inputStates('input', inState);
          inStates.push( { portInfo: inPortInfo, state: inState } ); 

          // Insert one in the middle 
          inPortInfo = { inportName: 'input1' };
          inState = { vnid: 22,
                      data: 'middle data',
                      lm: createLm() };
          component.vni().inputStates('input1', inState);
          inStates.push( { portInfo: inPortInfo, state: inState } ); 

          // Verify that we have all of them 
          inStates.forEach( function(inState) { 
              var actualState = component.vni().inputStates(inState.portInfo.inportName);
              actualState.should.deep.equal( inState.state );
          });
    });
    it('should fall back to no vnid state', function() {
         var state = { vnid: '010',
                       data: 'hello world from originating node',
                       lm: createLm() }

         var context = component.vni().inputStates('inputa', 'upstream1', 'output', state);
         context.should.exist;

         var result = component.vni('010').inputStates('inputa', 'upstream1', 'output'); 
         verifyInputState( result, state );
    }); 
    it('should set and get a new packet input state', function() {
         var state = { vnid: '010',
                       data: 'hello world from originating node',
                       lm: createLm() }

         var context = component.vni().inputStates('inputa', 'upstream1', 'output', state);
         context.should.exist;

         var result = component.vni().inputStates('inputa', 'upstream1', 'output'); 
         verifyInputState( result, state );
    }); 
    it('should set and get a new packet input state by socketIndex', function() {
         var state = { vnid: '010',
                       data: 'hello world from originating node',
                       lm: createLm() }

         var context = component.vni().inputStates('inputa', 0, state);
         context.should.exist;

         verifyInputState(component.vni().inputStates('inputa', 0), state);
         var result = component.vni().inputStates('inputa', 'upstream1', 'output'); 
         verifyInputState( result, state );
         component.vni().inputStates('inputa', 0, undefined);
         expect(component.vni().inputStates('inputa', 0)).to.be.undefined;
    }); 
    it('should set and get array of input states', function() {
         var one = { vnid: '010',
                       data: 'hello world from node one',
                       lm: createLm() }
         var two = { vnid: '010',
                       data: 'hello world from node two',
                       lm: createLm() }

         var context = component.vni().inputStates('inputa', [one, two]);
         context.should.exist;

         component.vni().inputStates('inputa').should.eql([one, two]);
         verifyInputState( component.vni().inputStates('inputa', 'upstream1', 'output'), one );
         verifyInputState( component.vni().inputStates('inputa', 'upstream2', 'output'), two );
    }); 
    it('should set and get hash of array of input states', function() {
         var one = { vnid: '010',
                       data: 'hello world from node one',
                       lm: createLm() }
         var two = { vnid: '010',
                       data: 'hello world from node two',
                       lm: createLm() }

         var context = component.vni().inputStates({inputa: [one, two]});
         context.should.exist;

         component.vni().inputStates('inputa').should.eql([one, two]);
         verifyInputState( component.vni().inputStates('inputa', 'upstream1', 'output'), one );
         verifyInputState( component.vni().inputStates('inputa', 'upstream2', 'output'), two );
    }); 
    it('should update a packet input state', function() {
         var state = { vnid: '015',
                       data: 'hola mundo from originating node',
                       lm: createLm() };

         var context = component.vni().inputStates('inputa', 'upstream1', 'output', state );
         context.should.exist;

         var result = component.vni().inputStates('inputa', 'upstream1', 'output'); 
         verifyInputState( result, state );

         var state2 = { vnid: '016',
                        data: 'bonjour tout le monde from originating node',
                        lm: createLm() };
         var context2 = component.vni().inputStates('inputa', 'upstream1', 'output', state2 );
         context2.should.exist;

         var result2 = component.vni().inputStates('inputa', 'upstream1', 'output'); 
         verifyInputState( result2, state2 );
    });
    it('should delete an IIP input state', function() {
         var portInfo = { inportName: 'inputPort' };
         var state = { vnid: '0020',
                       data: 'Guten tag',
                       lm: createLm() }

         var context = component.vni().inputStates('input', state);
         context.should.exist;

         var result = component.vni().inputStates('input'); 
         verifyInputState( result, state );

         var deleteContext = component.vni().inputStates('input', undefined); 
         deleteContext.should.exist;

         var result2 = component.vni().inputStates('input'); 
         expect( result2 ).to.be.undefined;
    });
});

function verifyInputState( inputState, expectedState ) {
    inputState.should.be.an('object');
    inputState.should.have.all.keys( 'vnid', 'data', 'lm' );
    inputState.vnid.should.equal( expectedState.vnid );
    inputState.data.should.deep.equal( expectedState.data );
    inputState.lm.should.equal( expectedState.lm );
}
