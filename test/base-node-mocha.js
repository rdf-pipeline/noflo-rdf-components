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

  describe('#assign', function () {
   
    it('should assign specified properties to "this" instance.', function() {
      should.exist( basenode.assign );
      basenode.assign.should.be.a('function');

      var assign = basenode.assign('options'); 
      assign.should.be.a('function');

      delete this.name;
      delete this.attr;
      delete this.obj;
      
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

      this.name.should.exist;
      this.attr.should.exist;
      this.obj.should.exist;

      this.name.should.equal(nameValue);
      this.attr.should.equal(attrValue);
      this.obj.should.equal(objValue);
    });
  });

  describe('#defaultPorts', function () {
    
    it('should contain default output ports', function() {
      should.exist(basenode);

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
   
    it('should call the specified function to process data.', function() {
      should.exist( basenode.on );
      basenode.on.should.be.a('function');

      var testDataValue = 'testData';
      var testData = { payload: testDataValue };

      var execute = function(data) { 
        should.exist(data);
        data.should.be.an('object'); 
        expect(data).to.have.property('payload');
        data.payload.should.equal(testDataValue);
      };

      var on = basenode.on(execute); 
      on.should.be.a('function');

     
      delete this.ondataExecuted;
      on.call( this, testData );
    });
  });

});
