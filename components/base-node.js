// base-node.js

/**
 * This file contacts the common code used by all of the variations of any RDF
 * node componentin the noflo implementation of the RDF Pipeline.
 */

var _ = require('underscore');

module.exports = {

  /**
   * This function takes an object name and returns a function that can
   * be called later to assign the run-time data values of the object
   * to the current instance.
   */
  assign: function(name, transform) { 
    return function(data){
      for (var key in data) {
        if (data.hasOwnProperty(key)) { 
          this[key] = data[key];
          // console.log('base-node assign setting '+key+' to ' + data[key]);
        }
      }
      // Record that this object was processed 
      this[name] = true;
      // console.log('Assign has processed object '+name);
    };
  },

  /**
   * Default port definitions used by all components.  Will be
   * extended to add component specific ports
   */
   defaultPorts: {
     outPorts: {
       out: {
         description: 'State file for this file node',
         datatype: 'string',
         required: false,
         addressable: false,
         buffered: false
       },
       error: {
         description: 'Error info or Stderr of the file updater script',
         datatype: 'string',
         required: false,
         addressable: false,
         buffered: false
       }
     }
   },

  /**
   * sets up an event handler to be executed when a noflo event of the specified type occurs
   *
   * @param type type of event to callback on e.g., connect, data, disconnect
   * @param callback callback function to be executed
   */
   on: function(type, callback) {
     return function(event, payload) {
       if (type[event]) type[event].call(this.nodeInstance, payload);
     };
   },

   push: function(item, array) {
     var ar = array || [];
     ar.push(item);
     return ar;
   } 

};

