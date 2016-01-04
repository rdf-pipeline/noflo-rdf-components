/**
 * File: base-node-mocha.js
 * Unit tests for the base-node APIs defined in components/base-node.js
 */

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var basenode = require('../components/base-node');

describe('base-node', function() {

  it('base-node should exist', function() {
    should.exist( basenode );
  });

  describe('#assign', function () {

    it('assign function should exist in base-node exports', function() {
      basenode.assign.should.exist;
      basenode.assign.should.be.a('function');
    });

    it('should assign specified object to "this" instance.', function() {

      var assign = basenode.assign('options'); 
      assign.should.be.a('function');

      // ensure we start with fresh options - no past test contamination
      delete this.options;
      
      // Create a test object with a string, number, and object
      var nameValue = "Test",
        attrValue = 1,
        objAttrValue = "objAttrVal",
        objValue = { objAttr: objAttrValue };
      
      var testObject = { 
        name: nameValue, 
        attr: attrValue, 
        obj: objValue 
      };

      // Execute assign function with the test object
      assign.call( this, testObject ); 

      // Verify that all 3 object properties exist
      this.options.name.should.exist;
      this.options.attr.should.exist;
      this.options.obj.should.exist;

      // Verify that all 3 values of the properties are correct
      this.options.name.should.equal(nameValue);
      this.options.attr.should.equal(attrValue);
      this.options.obj.should.equal(objValue);

      // clean up 
      delete this.options;
    });

    it('should transform an object before saving it in "this" instance' , function() {

       // Create a simple transformation function - it will concatenate strings
       var concat=function( string, current ) {
          current = (current) ? current.toString() + string.toString() : string.toString();
          return current;
       }

       // Clear out the test String to be sure there's no garbage hanging around
       this.testString = '';

       // Get a handle to an assign function for the testString, with a concat transform
       var assign = basenode.assign('testString', concat); 
       assign.should.be.a('function');

       // Pass in a string to assign and verify results
       var first = '1';
       assign.call(this, first); 
       this.testString.should.exist;
       this.testString.should.equal(first);

       // Pass in a second string to assign and verify we got concatenation
       var second = '2';
       assign.call(this, second); 
       this.testString.should.equal(first+second);

       // clean up
       delete this.testString;
    });
  });

  describe('#defaultPorts', function () {
    
    it('defaultPorts should exist in base-node exports', function() {
      should.exist( basenode.defaultPorts );
      basenode.defaultPorts.should.be.an('object');
    });
   
    it('should contain default output ports', function() {

      basenode.defaultPorts.should.have.property('outPorts');
      basenode.defaultPorts.outPorts.should.exist;
      basenode.defaultPorts.outPorts.should.be.an('object');
    });

    it('should contain an "out" output port', function() {
      basenode.defaultPorts.outPorts.should.have.property('out');
      basenode.defaultPorts.outPorts.out.should.exist;
      basenode.defaultPorts.outPorts.out.should.be.an('object');
    });

    it('should contain an "error" output port', function() {
      basenode.defaultPorts.outPorts.should.have.property('error');
      basenode.defaultPorts.outPorts.error.should.be.an('object');
      basenode.defaultPorts.outPorts.error.should.exist;
      basenode.defaultPorts.outPorts.error.datatype.should.equal('string');
    });
  });

  describe('#on', function () {
   
    it('on function should exist in base-node exports', function() {
      basenode.on.should.exist;
      basenode.on.should.be.a('function');
    });

    it('should call the specified function to process data.', function() {

      var testDataValue = 'testData';
      var testData = { payload: testDataValue };

      var execute = function(data) { 
        data.should.exist;
        data.should.be.an('object'); 
        data.should.have.property('payload');
        data.payload.should.equal(testDataValue);
      };

      var on = basenode.on({data: execute}); 
      on.should.be.a('function');

      delete this.ondataExecuted;

      expect(on.call( this, testData )).to.not.throw.error;
    });

    it('on function should fail if called with no parameters', function() {
      expect(basenode.on).to.throw(Error);
    });
  });

  describe('#push', function () {
   
    it('push function should exist in base-node exports', function() {
      basenode.push.should.exist;
      basenode.push.should.be.a('function');
    });

    it('should create a new array and add a string to it if no array is specified', function() {
      var string = "Test String";
      var result = basenode.push(string);

      result.should.exist;
      result.should.be.an('array');
      result.should.have.length(1);
      result.should.be.deep.equal([string]);
    });

    it('should add an integer to an existing empty array', function() {
      var anInt = 99;
      var testArray = []; 
      var result = basenode.push( anInt, testArray );

      result.should.exist;
      result.should.be.an('array');
      result.should.have.length(1);
      result.should.be.deep.equal([anInt]);
    });

    it('should add multiple elements of mixed type to array', function() {
      var testArray = []; 
      var string = "Test String";
      var anInt = 99;
      var myObj = { objString: string,  
                    int: anInt };

      var result = basenode.push(string, testArray);
      result.should.exist;
      result.should.be.an('array');
      result.should.have.length(1);

      result = basenode.push(anInt, testArray);
      result.should.exist;
      result.should.be.an('array');
      result.should.have.length(2);
      result.should.contain(string);
      result.should.contain(anInt);

      result = basenode.push(myObj, testArray);
      result.should.exist;
      result.should.be.an('array');
      result.should.have.length(3);
      result.should.contain(string);
      result.should.contain(anInt);
      result.should.contain(myObj);
    });

    it('should not fail with a null value', function() {
      var nullVal = null;
      var result = basenode.push(nullVal);
      result.should.exist;
      result.should.be.an('array');
      result.should.have.length(0);
    });
  });

});
