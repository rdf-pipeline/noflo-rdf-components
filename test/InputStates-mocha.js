/**
 * File: InputStatess-mocha.js
 */

var chai = require('chai');
var should = chai.should();
var expect = chai.expect;

var InputStates = require('../components/InputStates');
var componentFactory = require('../components/event-component-factory.js');
var test = require('./common-test');

describe("InputStates", function() {

    it("should exist as a function", function() {
        InputStates.should.exist;
        InputStates.should.be.a('function');
    });

    it("should throw an error if no port specified", function() {
        expect(InputStates).to.throw(Error, /Invalid arguments specified for InputState/);
    });

    it("should be undefined if no InputState has been set for any port", function() {
        expect( InputStates('input') ).to.be.undefined;
    });

    it("should be undefined if InputState set for another port, but not the requested port", function() {
        // Set test input data
        var testData = "Test State";
        var testLm = "LM1328113669.00000000000000001";
        var initialTestState = { data: testData, 
                                 lm: testLm };
        var inportName = "input";

        // Set the input state for an "input" port
        var context = InputStates( inportName, 
                                   initialTestState );

        expect( InputStates('input2') ).to.be.undefined;
    });

    it("should get and set state for an IIP port", function() {

        // Set test input data
        var testData = "Test State";
        var testLm = "LM1328113669.00000000000000001";
        var initialTestState = { data: testData, 
                                 lm: testLm };
        var inportName = "input";

        // Set the input state for an "input" port
        var context = InputStates( inportName, 
                                   initialTestState );

        // Context here will be the node.js context since mocha is running on that by default
        context.should.not.be.undefined;
        context.process.should.exist;
        context.process.argv.should.exist;
        context.process.env.should.exist;

        // Verify the correct input state is there
        var myInputState = InputStates( inportName );
        myInputState.should.be.an('object');
        myInputState.should.have.all.keys('data', 'lm');
        myInputState.data.should.equal(testData);
        myInputState.lm.should.equal(testLm);
    });

    it("should get and set state for a port with edges", function() {

        // Set test input data
        var testData = "Test State";
        var testLm = "LM1328113669.00000000000000001";
        var initialTestState = { data: testData, 
                                 lm: testLm };
        var inportName = "input";
        var sourceNodeName = "source_node";
        var sourceNodePort = "source_port";

        // Set the input state for an "input" port
        var context = InputStates( inportName, 
                                   sourceNodeName,
                                   sourceNodePort,
                                   initialTestState );

        // Context here will be the node.js context since mocha is running on that by default
        context.should.not.be.undefined;
        context.process.should.exist;
        context.process.argv.should.exist;
        context.process.env.should.exist;

        // Verify the correct input state is there
        var myInputState = InputStates( inportName,
                                        sourceNodeName,
                                        sourceNodePort );
        myInputState.should.be.an('object');
        myInputState.should.have.all.keys('data', 'lm');
        myInputState.data.should.equal(testData);
        myInputState.lm.should.equal(testLm);
    });

    it("should change state on a noflo component", function() {
        return Promise.resolve({
            inPorts:{
                'input':{
                     description: "test input port",
                }
            },
            outPorts:{
                'output':{
                     description: "test output port",
                }
            }
        }).then(componentFactory).then(test.createComponent).then(function(component){
            return new Promise(function(callback){

                // Set the input state for an "input" port
                var testInportData1 = "Test Input State 1";
                var testInportLm1 = "LM1328113669.00000000000000000";
                var testState1 = { data: testInportData1, 
                                        lm: testInportLm1 };
                var inportName = "input";
                var inputContext = InputStates.call( component, 
                                                     inportName, 
                                                     testState1 );

                // Verify context returned is the component context 
                verifyContext( inputContext );

                // Get the current input state for the port and verify it matches 
                // the test data set up above 
                var resultingState = InputStates.call( component, 
                                                       inportName );
                verifyInputState( resultingState, testInportData, testInportLm );

                // Now change the port state to something else
                testInportData2 = "A new test input state!";
                testInportLm2 = "LM1328113661.00000000000000001";
                var testState2 = { data: testInportData2, 
                                   lm: testInportLm2 };

                // Set the input state to newTestState 
                inputContext = InputStates.call( component, 
                                                 inportName, 
                                                 testState2 );

                // Verify context returned is the component context 
                verifyContext( inputContext );

                // Get the latest input state
                resultingState = InputStates.call( component, 
                                                   inportName );
                // Verify the input state for input port is now the new state 
                verifyInputState( resultingState, testInportData2, testInportLm2 );
            });
        }).should.be.fulfilled;
    });
    it("should get correct state on a two port noflo component with state set for only one port", function() {
        return Promise.resolve({
            inPorts:{
                'input1':{
                     description: "test input port 1",
                },
                'input2':{
                     description: "test input port 2",
                },
            },
            outPorts:{
                'output':{
                     description: "test output port",
                }
            }
        }).then(componentFactory).then(test.createComponent).then(function(component){
            return new Promise(function(callback){

                // Set the input state for an "input" port
                var testInportData = "Test Input State";
                var testInportLm = "LM1328113669.00000000000000000";
                var initialTestState = { data: testInportData, 
                                         lm: testInportLm };

                var inportName = "input1";
                var sourceNodeName = "source_node";
                var sourceNodePort = "source_port";

                var inputContext = InputStates.call( component, 
                                                     inportName, 
                                                     sourceNodeName,
                                                     sourceNodePort,
                                                     initialTestState );

                // Verify context returned is the component context 
                verifyContext( inputContext );

                // Verify the correct input state for input port 1 
                var myInputState = InputStates.call( component, 
                                                     inportName,
                                                     sourceNodeName,
                                                     sourceNodePort );
                verifyInputState( myInputState, testInportData, testInportLm );

                // Verify the correct input state for input port 2  
                // it should be undefined since we never set it
                expect( InputStates('input2') ).to.be.undefined;
            });
        }).should.be.fulfilled;
    });

    it("should get and set state for both ports on a two port noflo component", function() {
        return Promise.resolve({
            inPorts:{
                'input1':{
                     description: "test input port 1",
                },
                'input2':{
                     description: "test input port 2",
                },
            },
            outPorts:{
                'output':{
                     description: "test output port",
                }
            }
        }).then(componentFactory).then(test.createComponent).then(function(component){
            return new Promise(function(callback){

                // Set the input state for an "input" port 1
                var testInportData1 = "Test Input State 1";
                var testInportLm1 = "LM1328113669.00000000000000001";
                var initialTestState1 = { data: testInportData1, 
                                         lm: testInportLm1 };
                var inportName1 = "input1";
                var inputContext1 = InputStates.call( component, 
                                                      inportName1, 
                                                      initialTestState1 );

                // Verify context returned is the component context 
                verifyContext( inputContext1 );

                // Set the input state for an "input" port 2
                var testInportData2 = "Test Input State 2";
                var testInportLm2 = "LM1328113769.00000000000000002";
                var initialTestState2 = { data: testInportData2, 
                                          lm: testInportLm2 };
                var inportName2 = "input2";
                var inputContext2 = InputStates.call( component, 
                                                      inportName2, 
                                                      initialTestState2 );

                // Verify context returned is the component context 
                verifyContext( inputContext2 );

                // Verify the correct input statefor input port 1 
                var myInputState1 = InputStates( inportName1 );
                verifyInputState( myInputState1, testInportData1, testInportLm1 );

                // Verify the correct input statefor input port 2 
                var myInputState2 = InputStates( inportName2 );
                verifyInputState( myInputState2, testInportData2, testInportLm2 );
            });
        }).should.be.fulfilled;
    });
});

function verifyContext( context ) { 
    context.should.not.be.undefined;
    context.should.have.all.keys( 'error', 'inPorts', 'outPorts', 'description', 'icon' );
    context.inPorts.ports.should.be.an('object');
    context.inPorts.ports.input.should.exist;
    context.outPorts.ports.should.be.an('object');
    context.outPorts.ports.output.should.exist;
}

function verifyInputState( inputState, expectedData, expectedLm ) { 
    inputState.should.be.an('object');
    inputState.should.have.all.keys('data', 'lm');
    inputState.data.should.equal( expectedData);
    inputState.lm.should.equal( expectedLm);
}
