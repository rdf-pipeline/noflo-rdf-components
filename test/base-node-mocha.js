/**
 * File: base-node-mocha.js
 * Unit tests for the base-node APIs defined in components/base-node.js
 */

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var should = chai.should();

var basenode = require('../components/base-node');

describe('base-node', function() {

  it('base-node should exist', function() {
    should.exist( basenode );
  });

  describe('#assign', function () {

    it('assign function should exist in base-node exports', function() {
      should.exist( basenode.assign );
      basenode.assign.should.be.a('function');
    });
   
    it('should assign specified object to "this" instance.', function() {

      var assign = basenode.assign('options'); 
      assign.should.be.a('function');

      delete this.options;
      
      var nameValue = "Test",
        attrValue = 1,
        objAttrValue = "objAttrVal",
        objValue = { objAttr: objAttrValue };
      
      var testObject = { 
        name: nameValue, 
        attr: attrValue, 
        obj: objValue 
      };
      assign.call( this, testObject ); 

      this.options.name.should.exist;
      this.options.attr.should.exist;
      this.options.obj.should.exist;

      this.options.name.should.equal(nameValue);
      this.options.attr.should.equal(attrValue);
      this.options.obj.should.equal(objValue);
    });
  });

  describe('#defaultPorts', function () {
    
    it('defaultPorts should exist in base-node exports', function() {
      should.exist( basenode.defaultPorts );
      basenode.defaultPorts.should.be.an('object');
    });
   
    it('should contain default output ports', function() {

      should.exist( basenode.defaultPorts );
      basenode.defaultPorts.should.be.an('object');

      expect(basenode.defaultPorts).to.have.property('outPorts');
      should.exist( basenode.defaultPorts.outPorts );
      basenode.defaultPorts.outPorts.should.be.an('object');
    });

    it('should contain an "out" output port', function() {
      expect(basenode.defaultPorts.outPorts).to.have.property('out');
      should.exist( basenode.defaultPorts.outPorts.out );
      basenode.defaultPorts.outPorts.out.should.be.an('object');
    });

    it('should contain an "error" output port', function() {
      expect(basenode.defaultPorts.outPorts).to.have.property('error');
      basenode.defaultPorts.outPorts.error.should.be.an('object');
      should.exist( basenode.defaultPorts.outPorts.error );
      assert.typeOf(basenode.defaultPorts.outPorts.error.datatype, 'string');
    });
  });

  describe('#on', function () {
   
    it('on function should exist in base-node exports', function() {
      should.exist( basenode.on );
      basenode.on.should.be.a('function');
    });

    it('should call the specified function to process data.', function() {

      var testDataValue = 'testData';
      var testData = { payload: testDataValue };

      var execute = function(data) { 
        should.exist(data);
        data.should.be.an('object'); 
        expect(data).to.have.property('payload');
        data.payload.should.equal(testDataValue);
      };

      var on = basenode.on({data: execute}); 
      on.should.be.a('function');

      delete this.ondataExecuted;
      on.call( this, testData );
    });

    it('on function should fail if called with no parameters', function() {
      expect(basenode.on).to.throw(Error);
    });
  });

  describe('#push', function () {
   
    it('push function should exist in base-node exports', function() {
      should.exist( basenode.push );
      basenode.push.should.be.a('function');
    });

    it('should create a new array and add a string to it if no array is specified', function() {
      var string = "Test String";
      var result = basenode.push(string);

      should.exist( result);
      assert.typeOf( result, 'array', 'testArray should be an array');
      expect(result).to.have.length(1);
      expect(result).to.deep.equal([string]);
    });

    it('should add an integer to an existing empty array', function() {
      var anInt = 99;
      var testArray = []; 
      var result = basenode.push( anInt, testArray );

      should.exist( result );
      assert.typeOf( result, 'array', 'Expected an array');
      expect(result).to.have.length(1);
      expect(result).to.deep.equal([anInt]);
    });

    it('should add multiple elements of mixed type to array', function() {
      var testArray = []; 
      var string = "Test String";
      var anInt = 99;
      var myObj = { objString: string,  
                    int: anInt };

      var result = basenode.push(string, testArray);
      should.exist( result);
      assert.typeOf( result, 'array', 'testArray should be an array');
      expect(result).to.have.length(1);

      result = basenode.push(anInt, testArray);
      should.exist( result);
      assert.typeOf( result, 'array', 'testArray should be an array');
      expect(result).to.have.length(2);
      assert.include( result, string, 'result should contain string' );
      assert.include( result, anInt, 'result should contain integer' );

      result = basenode.push(myObj, testArray);
      should.exist( result);
      assert.typeOf( result, 'array', 'testArray should be an array');
      expect(result).to.have.length(3);
      assert.include( result, string, 'result should contain string' );
      assert.include( result, anInt, 'result should contain integer' );
      assert.include( result, myObj, 'result should contain object' );
    });

    it('should not fail with a null value', function() {
      var nullVal = null;
      var result = basenode.push(nullVal);
      should.exist( result);
      assert.typeOf( result, 'array', 'testArray should be an array');
      expect(result).to.have.length(0);
    });
  });

});
