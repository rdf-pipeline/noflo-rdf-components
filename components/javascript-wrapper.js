/**
 * This file contacts the common code used by all of the variations of any RDF
 * node componentin the noflo implementation of the RDF Pipeline.
 */

var _ = require('underscore');

// TODO: Revisit with James' latest work
var promiseComponent = require('./promise-component');
var rpf = require('./rpf');

/**
 * This module provides a Javascript wrapper for updaters.  It is responsible for setting up the
 * code to ensure updater callback, and then invoking the RDF pipeline framework to complete building
 * the component and setting up the vni and state metadata.
 *
 * @param nodeDef updater node definition. This can be a simple updater function, or an object that contains 
 *        updater metadata (e.g., input/output port definitions, description, icons), and an updater.
 *
 * @return a promise to create the noflo rdf component
 */
module.exports = function(nodeDef) { 

    // Save the caller's node instance 
    var self = this;
    
    // Ensure we have at least one input port and and updater, using a default stub updater if 
    // there is none specified
    var updaterArgs = null;
    if ( _.isUndefined(nodeDef) || 
       ( ! _.isFunction(nodeDef) && ( _.isEmpty( nodeDef ) || ( _.isEmpty( nodeDef.inPorts ))))) {
       // Got nothing to work with - no input ports and no updater, so create a default updater and input port 
       nodeDef = { 
           inPorts: {
               input: {
                   datatype: 'object',
                   description: "default input port" 
               }
           },
           updater: defaultUpdater
       };

    }  else if ( _.isUndefined( nodeDef.updater ) && !_.isFunction(nodeDef)) { 
       // Got some node metadata, but no node updater - use the metadata with default updater
       nodeDef = _.extend( nodeDef, 
                           { updater: defaultUpdater } );

    } else if ( _.isFunction( nodeDef ) ) { 
        // Got an updater but no metadata - use updater args as input port list
        // This assumes that all updater arguments are input
        updaterArgs = introspect( nodeDef );
        nodeDef = { inPorts: updaterArgs,
                    updater: nodeDef };
    } 

    // Have an updater now, no matter what, be it default or not - figure out what the updater arguments are
    var updaterArgs = (_.isNull( updaterArgs )) ? introspect( nodeDef.updater ) : updaterArgs; 
    var inPorts = _.isArray(nodeDef.inPorts) ? _.object(nodeDef.inPorts, []) : nodeDef.inPorts;

    return promiseComponent( 
                         _.defaults({
                             inPorts: _.mapObject(inPorts, function(port, name) {
                                 return _.extend( port, 
                                                  { ondata: ondata.bind( self, name, updaterArgs, nodeDef )});
                             })
                           }, nodeDef)
                     );

}; // module.exports

// Define a default updater stub function to be used if the caller 
// did not pass one in.  Simply returns whatever the original input was so it
// can be sent through the output port to the next component
var defaultUpdater = function() { 
    return { out: arguments };
}

// Introspect the updater to determine what its parameters are.
// The algorithm here comes from the following sources:
//  - http://stackoverflow.com/questions/6921588/is-it-possible-to-reflect-the-arguments-of-a-javascript-function#answer-13660631
//  - https://github.com/angular/angular.js/blob/master/src/auto/injector.js
var introspect = function( fn ) {

    var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
    var FN_ARG_SPLIT = /,/;
    var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
    var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
  
    try {
        var fnText = fn.toString().replace(STRIP_COMMENTS, '');
        var argDecl = fnText.match(FN_ARGS);
        var rawArgs = argDecl[1].split(FN_ARG_SPLIT);

        var args = []; // default to no args
        if ( ! _.isEqual(rawArgs, [''] )) { 
            // Got some args so extract them
            args = _.map( rawArgs, function( arg ) { 
                return arg.replace(FN_ARG, function(all, underscore, name) { return name });
            });
        }

        return args;
    } catch (e) { 
        // Could throw exception if we do not have source to introspect
        // Use default of empty argument list
        return [];
    }
};

var ondata = function( portName, updaterArgs, nodeDef, payload ) {

     // TODO: Integrate with James' work
     if ( _.isUndefined( this.rpf ) ) { 
         this.rpf = rpf;
     } 

     // First, save the data to the state
     var vni = this.rpf.vni('');
     vni.inputState( portName, 'test', '*', payload );

     // Do we have data for our input ports?  
     var allInputStates = vni.allInputStates();
     var inPorts = _.isArray(nodeDef.inPorts) ? _.object(nodeDef.inPorts, []) : nodeDef.inPorts;
     var required = _.compact(_.map(inPorts, function(port, name){
         return port && port.required && name;
     }));
     var missing = _.difference(required, _.keys(allInputStates));
     if ( ! _.isEmpty( missing ) ) {
        // Don't have all port data yet - can't call updater so just return
       return; 

     } else { 
        // Do we have any updaterArgs?  We might not if we do not have source code
        if ( _.isEmpty( updaterArgs ) ) { 
           // No updaterArgs, so just pass the state 
           return nodeDef.updater.call( this, this.rpf.state );

        } else {

           // Have one or more parameters - get them in the right order and pass them 
           var parameters = _.map( updaterArgs, function( arg ) { 
               var parameter = vni.inputState( arg, 'test', '*' );
               if ( _.isUndefined(parameter) && nodeDef.outPorts && nodeDef.outPorts.hasOwnProperty( arg ) ) {
                   // passing in the name of the output port - is this correct? 
                   parameter = arg;
               }
               return parameter; 
            });
                
            return nodeDef.updater.apply( this, parameters );
        }
    }
}; 

if (process.env.NODE_ENV === 'test') {
  module.exports._private = { introspect: introspect };
} 
