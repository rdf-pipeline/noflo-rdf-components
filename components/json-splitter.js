// json-splitter.js

/**
 * This component takes a json string with one or more array elements, parses it, and makes each array element into an 
 * individual records.  Each record is adorned with a virtual node ID (vnid) to uniquely identify it in the rdf pipeline, 
 * and sends them on to the next component.
 */

var jsonpointer = require('jsonpointer');

var _ = require('underscore');
var basenode = require('./base-node');

exports.getComponent = basenode.updaterComponent({

  description: 'Splits a json dataset into individual records, adds a vnid to each, and sends them on.',

  inPorts: { 
    in: { 
      addressable: true, 
      datatype: 'string',
      description: 'json string input',
      required: true
    },

    json_pointer: {
      addressable: true, 
      datatype: 'string',
      description: 'json pointer for the json data attribute to use as the vnid (RFC 6901)',
      required: true
    }
  },

  update: function( args ) {   

    var outPort = this.outPorts.out; 
    var errorPort = this.outPorts.error; 

    // Attempt to parse the JSON data received
    var parsedData = null;
    try { 
      parsedData = JSON.parse( this.in.replace(/\r?\n|\r/,'') );
    } catch(e) {
      basenode.handleError( "Unable to parse JSON for "+this.in+": "+e ); 
    }

    var key = null;
    var didSend = false;
    if ( _.isArray( parsedData ) ) { 

      var jsonPointer = jsonpointer.compile(this.json_pointer); 
      parsedData.forEach( function(datum) {   

        // Get and assign the hash key for this record
        key = jsonPointer.get(datum);
        if ( _.isNull( key ) ) {
          this.handleError( "Unable to find "+args.json_pointer+" in "+datum);
        } else {
          datum['vnid'] = key;
          outPort.send(datum); 
          didSend = true;
        }

      }); 
      if ( didSend ) { outPort.disconnect(); }

    } else if ( _.isObject( parsedData ) ) { 

       // Have just one element in the json data, so build our one element hash
       key = jsonpointer.get(parsedData, args.json_pointer);
       if ( _.isNull( key ) ) {
         this.handleError( 'Unable to find '+this.json_pointer+' in '+parsedData );
       } else {
         parsedData['vnid'] = key;
         outPort.send(parsedData); 
         outPort.disconnect(); 
       }

    } else {
      this.handleError('Expected a JSON object or array of objects!');
    }

  }

});
