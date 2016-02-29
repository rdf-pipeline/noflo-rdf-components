/**
 * File: vni-manager-mocha.js
 * Unit tests for the vni APIs defined in src/vni-manager.js
 */

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var componentFactory = require('../src/noflo-component-factory');
var createState = require('../src/create-state');
var inputStates = require('../src/input-states');
var promiseOutput = require('../src/promise-output');

var test = require('./common-test');

var vniManager = require('../src/vni-manager');

describe('vni-manager', function() {

    beforeEach(function() {

        component = test.createComponent(componentFactory({
            inPorts:{input:{
                ondata: promiseOutput(function(payload){
                    return payload + " world";
                })
            }},
            outPorts: promiseOutput.outPorts
          }, vniManager )
        );

    });

    afterEach(function() {
        // clean up
        component.deleteVnis();
    });

    it('should exist as a function', function() {
      vniManager.should.exist;
      vniManager.should.be.a('function');
    });

    describe('#vnis', function() {
        it('should exist as an object in the component instance', function() {
            component.vnis.should.exist;
            component.vnis.should.be.a('object');
            Object.keys( component.vnis ).should.have.length( 0 );
        });
    });

    describe('#vni', function() {

        it('should create and return a new IIP vni if no vnid is specified and no vni exists', function() {

            var testVni = component.vni();

            testVni.should.be.an('object');
            testVni.inputStates.should.exist;
            testVni.inputStates.should.be.a('function');
            testVni.errorState.should.exist;
            testVni.errorState.should.be.a('function');
            testVni.outputState.should.exist;
            testVni.outputState.should.be.a('function');

            expect( testVni.parentVni ).to.be.undefined;
            expect( testVni.previousLms ).to.be.undefined;
        });

    it('should create and return a new IIP vni if an empty vnid is specified and no vni exists', function() {
  
            var testVnid = '';
            var testVni = component.vni( testVnid );

            testVni.should.be.an('object');
            testVni.inputStates.should.exist;
            testVni.inputStates.should.be.a('function');
            testVni.errorState.should.exist;
            testVni.errorState.should.be.a('function');
            testVni.outputState.should.exist;
            testVni.outputState.should.be.a('function');

            expect( testVni.parentVni ).to.be.undefined;
            expect( testVni.previousLms ).to.be.undefined;
        });

        describe('#delete', function() {
            it('should delete the VNI', function() {

                Object.keys( component.vnis ).should.have.length( 0 );

                var testVnid = '';
                var testVni = component.vni( testVnid );
                testVni.should.be.an('object');
                Object.keys( component.vnis ).should.have.length( 1 );

                var context = testVni.delete();
                context.should.equal(component);
                Object.keys( component.vnis ).should.have.length( 0 );

                // verify we get a different VNI instance back
                var testVni2 = component.vni( testVnid );
                testVni2.should.be.an('object');
                Object.keys( component.vnis ).should.have.length( 1 );
            });
        });
   
        describe('#errorState', function() {
            it('should set and get errorState', function() {
    
                var testVnid = '';
                var testVni = component.vni( testVnid );

                // Set up a test state
                var testLm =  'LM1328113669.00000000000000001';
                var testString = "Some error data";
                var state = createState( testVnid, testString, testLm );

                // Test set state
                var context = testVni.errorState( state );
                context.should.be.an('object');

                // Test get state
                var outState = testVni.errorState();
                outState.should.be.an('object');
                outState.should.have.all.keys('vnid', 'lm','data');
                outState.data.should.equal( testString );
                outState.lm.should.equal( testLm );
            });

            it('should clear error state', function() {
    
                var testVnid = '';
                var testVni = component.vni( testVnid );

                // Set up a test state
                var testLm =  'LM1328113669.00000000000000001';
                var testString = "Some error data";
                var state = createState( testVnid, testString, testLm );

                // Test set state
                var context = testVni.errorState( state );
                context.should.be.an('object');

                // Test clear state 
                var clearContext = testVni.errorState( undefined );
                clearContext.should.be.an('object');

                // Test get of cleared state 
                var clearedState = testVni.errorState();
                expect( clearedState ).to.be.an('undefined');
            });
        });

        describe('#inputState', function() {

            it('should set and get an inputState', function() {

                // Set up a test state
                var testVnid = '';
                var testLm =  'LM1328113669.00000000000000001';
                var testString = "Some input data";
                var state = createState( testVnid, testString, testLm );

                // Set state on the input port
                var context = component.vni().inputStates( {input: state} );
                context.should.be.an('object');

                // Get the input states and verify they are as we expect
                var inputStates = component.vni().inputStates();
                inputStates.should.be.an('object');
                Object.keys( inputStates ).should.have.length( 1 );
                inputStates.should.have.all.keys( 'input' );
                inputStates.input.should.have.all.keys( 'vnid', 'data', 'lm' );
                inputStates.input.vnid.should.equal( testVnid );
                inputStates.input.data.should.equal( testString );
                inputStates.input.lm.should.equal( testLm ); 
            });

            it('should delete an inputState', function() {
                // Set up a test state
                var testVnid = '';
                var testLm =  'LM1328113669.00000000000000001';
                var testString = "Some input data";
                var state = createState( testVnid, testString, testLm );

                // Set state on the input port
                var context = component.vni().inputStates( {input: state} );
                context.should.be.an('object');

                // Verify that we have an input state set now
                var inputStates = component.vni().inputStates();
                inputStates.should.be.an('object');
                
                // Now clear it
                var deleteContext = component.vni().inputStates( {'input': undefined} ); 
                deleteContext.should.be.an('object');
                var inputStates2 = component.vni().inputStates();
                inputStates.should.be.an('object');
                expect( inputStates2.input ).to.be.an('undefined');
            });
        });

        describe('#outputState', function() {

            it('should set and get outputState', function() {

                var testVnid = '';
                var testVni = component.vni( testVnid );

                // Set up a test state
                var testLm =  'LM1328113669.00000000000000001';
                var testString = "Some test data";
                var state = createState( testVnid, testString, testLm );

                // Test set state
                var context = testVni.outputState( state );
                context.should.be.an('object');

                // Test get state finds the expected output state
                var outState = testVni.outputState();
                outState.should.be.an('object');
                outState.should.have.all.keys('vnid', 'lm','data');
                outState.data.should.equal( testString );
                outState.lm.should.equal( testLm );
            });

            it('should clear outputState', function() {
                var testVnid = '';
                var testVni = component.vni( testVnid );

                // Set up a test state
                var testLm =  'LM1328113669.00000000000000001';
                var testString = "Some test data";
                var state = createState( testVnid, testString, testLm );

                // Test set state
                var context = testVni.outputState( state );
                context.should.be.an('object');

                // Test clearing the state 
                var clearContext = testVni.outputState( undefined );
                clearContext.should.be.an('object');

                // Test get of cleared state 
                var clearedState = testVni.outputState();
                expect( clearedState ).to.be.an('undefined');
            });
        });

    });

    describe('#deleteVni', function() {

        it('should delete the VNI by vnid', function() {

            Object.keys( component.vnis ).should.have.length( 0 );

            // Create a VNI
            var testVnid = '';
            var testVni = component.vni( testVnid );
            testVni.should.be.an('object');
            Object.keys( component.vnis ).should.have.length( 1 );

            // Delete it and verify it's gone
            var context = component.deleteVni( testVnid );
            context.should.equal(component);
            Object.keys( component.vnis ).should.have.length( 0 );

            // Create another VNI and verify it shows up
            var testVni3 = component.vni( testVnid );
            testVni3.should.be.an('object');
            Object.keys( component.vnis ).should.have.length( 1 );
        });

    });
   
    describe('#deleteVnis', function() {

        it('should delete all VNIs associated with this component', function() {

            Object.keys( component.vnis ).should.have.length( 0 );

            // Create 10 VNIs
            var myVnis = [];
            var numberOfVnis = 10;
            for ( var i=0; i < numberOfVnis; i++ ) { 

                myVnis[i] = component.vni( i );
                myVnis[i].should.be.an('object');

                Object.keys( component.vnis ).should.have.length( myVnis.length );
            }

            // Verify we got all 10
            Object.keys( component.vnis ).should.have.length( numberOfVnis );

            // Delete the VNIs and verify they are all gone 
            var context = component.deleteVnis();
            context.should.equal(component);
            Object.keys( component.vnis ).should.have.length( 0 );
        });

    });
});
