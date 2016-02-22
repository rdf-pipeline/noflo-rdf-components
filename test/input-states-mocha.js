/**
 * File: input-state-mocha.js
 * Unit tests for the input-state APIs defined in src/input-state.js
 */

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var inputStates = require('../src/input-states');
var createLm = require('../src/create-lm');

describe('input-states', function() {

  it('should exist as an object', function() {
    inputStates.should.be.an('object');
  });


  describe('#get', function() {
      it('should exist as a functions', function() {
          inputStates.get.should.be.a('function');
      });

      it('should return undefined when no state exists', function() {
          var portInfo = { inportName: 'inputPort' };
          expect( inputStates.get( portInfo ) ).to.be.undefined;
      });
  });

  describe('#get/#set', function() {

      beforeEach(function() {
         // ensure clean state
         inputStates.deleteAll(); 
      });

      afterEach(function() {
         // clean up
         inputStates.deleteAll(); 
      });

      it('should exist as functions', function() {
          inputStates.set.should.be.a('function');
      });

      it('should set and get a new IIP input state', function() {

         var portInfo = { inportName: 'inputPort' };
         var state = { vnid: '001',
                       data: 'hello world',
                       lm: createLm() }

         var context = inputStates.set( portInfo, state );
         context.should.exist;

         var result = inputStates.get( portInfo ); 
         verifyInputState( result, state );
      }); 

      it('should update an IIP input state', function() {

         var portInfo = { inportName: 'inputPort' };
         var state = { vnid: '002',
                       data: 'Hola Mundo',
                       lm: createLm() };

         var context = inputStates.set( portInfo, state );
         context.should.exist;

         var result = inputStates.get( portInfo ); 
         verifyInputState( result, state );

         var state2 = { vnid: '003',
                        data: 'Bonjour le monde',
                        lm: createLm() };
         var context2 = inputStates.set( portInfo, state2 );
         context2.should.exist;

         var result2 = inputStates.get( portInfo ); 
         verifyInputState( result2, state2 );
      });

      it('should set many IIP input states', function() {
        
          var inStates = [];
          var inPortInfo;
          var inState;

          for ( var i=0; i < 5; i++ ) {
               inPortInfo = { inportName: 'inputPort'+i };
               inState = { vnid: Number(i).toString(),
                           data: 'data' + i,
                           lm: createLm() };
               inputStates.set( inPortInfo, inState );
               inStates.push( { portInfo: inPortInfo, state: inState } ); 
          } 

          // Tack one onto the front 
          inPortInfo = { inportName: 'alphaPort' };
          inState = { vnid: 99,
                      data: 'alpha data',
                      lm: createLm() };
          inputStates.set( inPortInfo, inState );
          inStates.push( { portInfo: inPortInfo, state: inState } ); 

          // Insert one in the middle 
          inPortInfo = { inportName: 'inputPort22' };
          inState = { vnid: 22,
                      data: 'middle data',
                      lm: createLm() };
          inputStates.set( inPortInfo, inState );
          inStates.push( { portInfo: inPortInfo, state: inState } ); 

          // Verify that we have all of them 
          inStates.forEach( function(inState) { 
              var actualState = inputStates.get( inState.portInfo );
              actualState.should.deep.equal( inState.state );
          });
        
      });

      it('should set and get a new packet input state', function() {

         var portInfo = { inportName: 'inputPort',
                          sourceNodeName: 'originatingNode',
                          sourcePortName: 'originatingNodePort' };
         var state = { vnid: '010',
                       data: 'hello world from originating node',
                       lm: createLm() }

         var context = inputStates.set( portInfo, state );
         context.should.exist;

         var result = inputStates.get( portInfo ); 
         verifyInputState( result, state );
      }); 

      it('should update a packet input state', function() {
         var portInfo = { inportName: 'inputPort',
                          sourceNodeName: 'originatingNode',
                          sourcePortName: 'originatingNodePort' };
         var state = { vnid: '015',
                       data: 'hola mundo from originating node',
                       lm: createLm() };

         var context = inputStates.set( portInfo, state );
         context.should.exist;

         var result = inputStates.get( portInfo ); 
         verifyInputState( result, state );

         var state2 = { vnid: '016',
                        data: 'bonjour tout le monde from originating node',
                        lm: createLm() };
         var context2 = inputStates.set( portInfo, state2 );
         context2.should.exist;

         var result2 = inputStates.get( portInfo ); 
         verifyInputState( result2, state2 );
      });

      it('should set many packet input states', function() {

          var inStates = [];
          var inPortInfo;
          var inState;

          for ( var i=0; i < 5; i++ ) {
               inPortInfo = { inportName: 'inputPort+i',
                              sourceNodeName: 'originatingNode'+i,
                              sourcePortName: 'originatingNodePort'+i };
               inState = { vnid: Number(i).toString(),
                           data: 'data' + i,
                           lm: createLm() };
               inputStates.set( inPortInfo, inState );
               inStates.push( { portInfo: inPortInfo, state: inState } ); 
          } 

          // Tack one onto the front 
          inPortInfo = { inportName: 'alphaPort',
                         sourceNodeName: 'alphaNode',
                         sourcePortName: 'alphaPort' };
          inState = { vnid: 99,
                      data: 'alpha data',
                      lm: createLm() };
          inputStates.set( inPortInfo, inState );
          inStates.push( { portInfo: inPortInfo, state: inState } ); 

          // Insert one in the middle 
          inPortInfo = { inportName: 'inputPort22', 
                         sourceNodeName: 'alphaNode',
                         sourcePortName: 'alphaPort' };
          inState = { vnid: 22,
                      data: 'middle data',
                      lm: createLm() };
          inputStates.set( inPortInfo, inState );
          inStates.push( { portInfo: inPortInfo, state: inState } ); 

          // Verify that we have all of them 
          inStates.forEach( function(inState) { 
              var actualState = inputStates.get( inState.portInfo );
              actualState.should.deep.equal( inState.state );
          });
        
      });
  });

  describe('#delete', function() {

      it('should exist as a function', function() {
          inputStates.delete.should.exist;
          inputStates.delete.should.be.a('function');
      });

      it('should delete an IIP input state', function() {
         var portInfo = { inportName: 'inputPort' };
         var state = { vnid: '0020',
                       data: 'Guten tag',
                       lm: createLm() }

         var context = inputStates.set( portInfo, state );
         context.should.exist;

         var result = inputStates.get( portInfo ); 
         verifyInputState( result, state );

         var deleteContext = inputStates.delete( portInfo ); 
         deleteContext.should.exist;

         var result2 = inputStates.get( portInfo ); 
         expect( result2 ).to.be.undefined;
      });
  });
});

function verifyInputState( inputState, expectedState ) {
    inputState.should.be.an('object');
    inputState.should.have.all.keys( 'vnid', 'data', 'lm' );
    inputState.vnid.should.equal( expectedState.vnid );
    inputState.data.should.deep.equal( expectedState.data );
    inputState.lm.should.equal( expectedState.lm );
}
