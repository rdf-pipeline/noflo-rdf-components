// base-node.js

/**
 * This file contacts the common code used by all of the variations of any RDF
 * node componentin the noflo implementation of the RDF Pipeline.
 */

var _ = require('underscore');

var promiseComponent = require('./promise-component');

module.exports = {

  /**
   * This function takes an object name and returns a function that can
   * be called later to assign the run-time data values of the object
   * to the current instance.
   */
  assign: function(name, transform) { 
    return function(data){
        this[name] = _.isFunction(transform) ? transform(data, this[name]) : data;
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
     if ( type ) { 
       return function(event, payload, cb) {
         if (type[event]) type[event].call(this.nodeInstance, payload, cb);
       };
     } else {
       throw new Error("Expected an event type!");
     }
   },

   push: function(item, array) {
     var ar = array || [];
     if ( item ) { 
       ar.push(item);
     }
     return ar;
   },

   updatePromise: function(def) {

     return promiseComponent(

         _.defaults(
             def,
             { 
               inPorts: _.mapObject(
                          def.inPorts,
                          function(port, portName) {

                            return _.defaults(
                                     port,
                                     {
                                       ondata: function ( payload, socketIndex ) {
                                                 this[portName] = payload;
                                                 var self = this;
                                                 var shouldUpdate = 
                                                      _.reduce( _.keys( def.inPorts ), 
                                                                        function( memo, key ) { 
                                                                            return ( memo && ! _.isUndefined( self[key] ) );
                                                                        }, 
                                                                        true 
                                                                      );
                                                 if ( shouldUpdate ) {
                                                     return def.update.call( this, _.pick( this, _.keys(def.inPorts)));
                                                 }
                                               }
                                     }
                                   ) // _.defaults on each port
                          } // map each port function
                        ) // mapObject
             }
        )
     );
   },
};

