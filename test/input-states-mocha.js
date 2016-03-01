/**
 * File: input-state-mocha.js
 * Unit tests for the input-state APIs defined in src/input-state.js
 */

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var _ = require('underscore');
var componentFactory = require('../src/noflo-component-factory');
var test = require('./common-test');
var inputStates = require('../src/input-states');
var createLm = require('../src/create-lm');

describe('input-states', function() {
    var node, network;
    beforeEach(function(){
        var getComponent = componentFactory({
            inPorts:{
                input:{},
                input1:{},
                input2:{},
                input3:{},
                inputa:{
                    multi: true
                },
                inputb:{
                    multi: true
                }
            },
            outPorts:{
                output:{}
            }
        }, function(facade){
            node = facade;
            _.extend(facade, {
                vni: function(vnid) {
                    this.vnis = this.vnis || {};
                    this.vnis[vnid || ''] = this.vnis[vnid || ''] || {};
                    return {
                        inputStates: _.partial(inputStates, facade, vnid || '')
                    };
                }
            });
        });
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
            network.graph.addEdge('upstream2', 'output', 'test', 'input');
            network.graph.addEdge('upstream2', 'output', 'test', 'inputa');
            return network;
        }).then(function(nw){
            network = nw;
        });
    });
    afterEach(function(){
        network.stop();
    });
    it('should exist as a function', function() {
        node.vni().inputStates.should.be.a('function');
    });
    it('should fail if vnid is not a string', function() {
        expect(function(){return node.vni(-1).inputStates('input');}).to.throw(Error);
    });
    it('should fail if invalid port name', function() {
        expect(function(){return node.vni().inputStates('bogus');}).to.throw(Error);
    });
    it('should fail if not addressable', function() {
        expect(function(){return node.vni().inputStates('input', 0);}).to.throw(Error);
        expect(function(){return node.vni().inputStates('input', 0, {});}).to.throw(Error);
    });
    it('should return undefined when no state exists', function() {
        expect(node.vni().inputStates('input') ).to.be.undefined;
        expect(node.vni().inputStates('inputa', 0) ).to.be.undefined;
    });
    it('should list all ports', function() {
        node.vni().inputStates().should.have.all.keys(_.keys(node.inPorts));
    });
    it('should return an undefined state when an optional port that is not attached to anything', function() {
        expect(node.vni().inputStates('input2')).to.be.undefined;
    });
    it('should return [] when a multi port with nothing attached', function() {
        expect(node.vni().inputStates('inputb')).to.eql([]);
    });
    it('should set and get a new IIP input state', function() {
        var state = { vnid: '001',
                   data: 'hello world',
                   lm: createLm() }

        var context = node.vni().inputStates({'input': state});
        context.should.exist;

        var result = node.vni().inputStates('input');
        verifyInputState( result, state );
    });
    it('should treat undefined socketIndex the same as without it', function() {
        var state = {
            vnid: '001',
            data: 'hello world',
            lm: createLm()
        };

        var context = node.vni().inputStates('input', undefined, state );
        context.should.exist;

        var result = node.vni().inputStates('input', undefined);
        verifyInputState( result, state );
        verifyInputState( node.vni().inputStates('input'), state );
    });
    it('should fallback to no vnid', function() {
        var state = {
            vnid: '001',
            data: 'hello world',
            lm: createLm()
        };

        var context = node.vni().inputStates({'input': state});
        context.should.exist;

        var result = node.vni('001').inputStates('input');
        verifyInputState( result, state );
    });
    it('should set and get a new IIP input state hash', function() {
        var state = {
            vnid: '001',
            data: 'hello world',
            lm: createLm()
        };

        var context = node.vni().inputStates({input: state});
        context.should.exist;

        var result = node.vni().inputStates('input');
        verifyInputState( result, state );
    });
    it('should update an IIP input state', function() {
        var state = {
            vnid: '002',
            data: 'Hola Mundo',
            lm: createLm()
        };

        var context = node.vni().inputStates({'input': state});
        context.should.exist;

        var result = node.vni().inputStates('input');
        verifyInputState( result, state );

        var state2 = {
            vnid: '003',
            data: 'Bonjour le monde',
            lm: createLm()
        };
        var context2 = node.vni().inputStates({'input': state2});
        context2.should.exist;

        var result2 = node.vni().inputStates('input');
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
               node.vni().inputStates('input'+i, undefined, inState);
               inStates.push( { portInfo: inPortInfo, state: inState } );
          }

          // Tack one onto the front
          inPortInfo = { inportName: 'input' };
          inState = { vnid: 99,
                      data: 'alpha data',
                      lm: createLm() };
          node.vni().inputStates({'input': inState});
          inStates.push( { portInfo: inPortInfo, state: inState } );

          // Insert one in the middle
          inPortInfo = { inportName: 'input1' };
          inState = { vnid: 22,
                      data: 'middle data',
                      lm: createLm() };
          node.vni().inputStates({'input1': inState});
          inStates.push( { portInfo: inPortInfo, state: inState } );

          // Verify that we have all of them
          inStates.forEach( function(inState) {
              var actualState = node.vni().inputStates(inState.portInfo.inportName);
              actualState.should.deep.equal( inState.state );
          });
    });
    it('should fall back to no vnid state', function() {
         var state = { vnid: '010',
                       data: 'hello world from originating node',
                       lm: createLm() }

         var context = node.vni().inputStates('inputa', 0, state);
         context.should.exist;

         var result = node.vni('010').inputStates('inputa', 0);
         verifyInputState( result, state );
    });
    it('should set and get a new packet input state', function() {
         var state = { vnid: '010',
                       data: 'hello world from originating node',
                       lm: createLm() }

         var context = node.vni().inputStates('inputa', 0, state);
         context.should.exist;

         var result = node.vni().inputStates('inputa', 0);
         verifyInputState( result, state );
    });
    it('should set and get a new packet input state by socketIndex', function() {
         var state = { vnid: '010',
                       data: 'hello world from originating node',
                       lm: createLm() }

         var context = node.vni().inputStates('inputa', 0, state);
         context.should.exist;

         verifyInputState(node.vni().inputStates('inputa', 0), state);
         node.vni().inputStates('inputa', 0, undefined);
         expect(node.vni().inputStates('inputa', 0)).to.be.undefined;
    });
    it('should set and get array of input states', function() {
        var one = {
            vnid: '',
            data: 'hello world from node one',
            lm: createLm()
        };
        var two = {
            vnid: '',
            data: 'hello world from node two',
            lm: createLm()
        };

        // Set the states of two different upstream states: socketId 0 and 1
        var context = node.vni().inputStates({'inputa': [one, two]});
        context.should.exist;

        node.vni().inputStates('inputa').should.eql([one, two]);
        verifyInputState( node.vni().inputStates('inputa', 0), one );
        verifyInputState( node.vni().inputStates('inputa', 1), two );
    });
    it('should set and get hash of array of input states', function() {
        var one = {
            vnid: '010',
            data: 'hello world from node one',
            lm: createLm()
        };
        var two = {
            vnid: '010',
            data: 'hello world from node two',
            lm: createLm()
        };

        // inputa is setup as an addressable/multi port, so an array is used
        var context = node.vni().inputStates({inputa: [one, two]});
        context.should.exist;

        node.vni().inputStates('inputa').should.eql([one, two]);
        verifyInputState( node.vni().inputStates('inputa', 0), one );
        verifyInputState( node.vni().inputStates('inputa', 1), two );
    });
    it('should update a packet input state', function() {
         var state = { vnid: '015',
                       data: 'hola mundo from originating node',
                       lm: createLm() };

         var context = node.vni().inputStates('inputa', 0, state );
         context.should.exist;

         var result = node.vni().inputStates('inputa', 0);
         verifyInputState( result, state );

         var state2 = { vnid: '016',
                        data: 'bonjour tout le monde from originating node',
                        lm: createLm() };
         var context2 = node.vni().inputStates('inputa', 0, state2 );
         context2.should.exist;

         var result2 = node.vni().inputStates('inputa', 0);
         verifyInputState( result2, state2 );
    });
    it('should delete an IIP input state', function() {
         var portInfo = { inportName: 'inputPort' };
         var state = { vnid: '0020',
                       data: 'Guten tag',
                       lm: createLm() }

         var context = node.vni().inputStates({'input': state});
         context.should.exist;

         var result = node.vni().inputStates('input');
         verifyInputState( result, state );

         var deleteContext = node.vni().inputStates({'input': undefined});
         deleteContext.should.exist;

         var result2 = node.vni().inputStates('input');
         expect( result2 ).to.be.undefined;
    });
    it("should get the states from a multi port with both an IIP and an edge attached, with a vnid of '' coming on the edge attachment.", function() {
        network.graph.addInitial({data:'IIP'}, 'test', 'inputa');
        node.vni().inputStates('inputa', 0, {data:'upstream1'});
        node.vni().inputStates('inputa', 1, {data:'upstream2'});
        node.vni().inputStates('inputa', 2, {data:'IIP'});
        node.vni().inputStates('inputa').should.eql(
            [{data:'upstream1'}, {data:'upstream2'}, {data:'IIP'}]
        );
    });
    it("should get the states from a multi port with both an IIP and an edge attached, with a non-empty-string vnid coming on the edge attachment.", function() {
        network.graph.addInitial({data:'IIP'}, 'test', 'inputa');
        node.vni('0010').inputStates('inputa', 0, {data:'upstream1'});
        node.vni('0010').inputStates('inputa', 1, {data:'upstream2'});
        node.vni().inputStates('inputa', 2, {data:'IIP'});
        node.vni('0010').inputStates('inputa').should.eql(
            [{data:'upstream1'}, {data:'upstream2'}, {data:'IIP'}]
        );
    });
});

function verifyInputState( inputState, expectedState ) {
    inputState.should.be.an('object');
    inputState.should.have.all.keys( 'vnid', 'data', 'lm' );
    inputState.vnid.should.equal( expectedState.vnid );
    inputState.data.should.deep.equal( expectedState.data );
    inputState.lm.should.equal( expectedState.lm );
}
