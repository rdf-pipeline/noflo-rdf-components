// json-hasher.js

/**
 * This updater implements an RDF pipeline JSON file node as a noflo component.  It reads a JSON file with one 
 * or more elements, parses it,  gets a hash string from each record using the configured JSON Pointer, and 
 * converts this data into a hash of using the configured JSON Pointer value as the key, and the original 
 * record as the associated hash element.  The hash is returned from the updater for use by the RDF pipeline 
 * downstream.
 */

var fs = require('fs');
var jsonpointer = require('jsonpointer');
var _ = require('underscore');

var basenode = require('./base-node');

exports.getComponent = basenode.updatePromise({

  description: 'Reads a json dataset from a file & converts it into a hash with the json pointer values as the keys',

  inPorts: { 
      file_path: { 
        addressable: true, 
        datatype: 'string',
        description: 'path to the JSON file to be processed',
        required: true
      },

      json_pointer: {
        addressable: true, 
        datatype: 'string',
        description: 'json pointer for the json data attribute to use as the vnid (RFC 6901)',
        required: true
      }
  },

  /**
   * This updater expects an array of arguments that should contain at least these two arguments: 
   *   - file path to json data to process
   *   - json pointer describing the key to extract from each json data record and 
   *     use as the hash key for the record.
   */
  update: function( args ) {   

      // Attempt to read and parse the JSON file 
      var parsedData = null;
      try { 
        var jsonString = fs.readFileSync( args.file_path ).toString();
        parsedData =  JSON.parse( jsonString.replace(/\r?\n|\r/,'') );
      } catch(e) {
        this.handleError( "Unable to parse JSON ffrom file "+args.file_path+": "+e );
      }

      // Build the hash
      var hash = {}; 
      var key = null;
      if ( _.isArray( parsedData ) ) { 

          // Have an array of json data - walk the list of records and build the hash
          var jsonPointer = jsonpointer.compile(this.json_pointer); 
          parsedData.forEach( function(datum) {   

              // Get and assign the hash key for this record
              key = jsonPointer.get(datum);
              if ( _.isNull( key ) ) {
                  this.handleError( "Unable to find "+args.json_pointer+" in "+datum);
              } else {
                  hash[key] = datum;
              }
          }); 

      } else if ( _.isObject( parsedData ) ) { 

          // Have just one element in the json data, so build our one element hash 
          key = jsonpointer.get(parsedData, args.json_pointer);
          if ( _.isNull( key ) ) {
              this.handleError( 'Unable to find '+this.json_pointer+' in '+parsedData );
          } else { 
              hash[key] = parsedData;
          }
            
      } else { 
          this.handleError('Expected a JSON object or array of objects!');
      }

      return hash;
  }  

});
