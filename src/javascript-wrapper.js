/**
 * File: javascript-wrapper.js 
 */
var _ = require('underscore');

var framework = require('./framework');

var fRunUpdater = function( updater, updaterArgs, inputStates ) {

    // Have one or more parameters - get them in the right order and pass them 
    var self = this;
    var parameters = _.map( updaterArgs, function( arg ) { 
        return inputStates.getData(arg);
    });

    return updater.apply( this, parameters );
};

/**
 * This module provides a Javascript wrapper for updaters.  It is responsible for setting up the
 * code to ensure updater callback, and then invoking the RDF pipeline framework to complete building
 * the component and setting up the vni and state metadata.
 *
 * @param nodeDef updater node definition. This can be a simple updater function, or an object that contains 
 *        updater metadata (e.g., input port definitions, description, icons) with an updater.
 *
 * @this the context for this wrapper is the node instance.
 * @return a promise to create the noflo rdf component
 */
module.exports = function(nodeDef) { 

    // Get number of ports - we use this to ensure we have all data needed
    // TODO: remove when lower layers can handle figuring out when wrapper and updater should be invoked
    var numInPorts = _.reduce( nodeDef.inPorts, 
                         function( memo, port) { return ++memo; }, 0);  

    // Ensure we have at least one input port and and updater, using a default port and/or stub updater if 
    // there is none specified by the pipeline updater author
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

    // Have an updater now, no matter what, be it default or not - figure out what 
    // the updater arguments are
    var updaterArgs = (_.isNull( updaterArgs )) ? introspect( nodeDef.updater ) : updaterArgs; 
 
    // If we don't have any output ports defined, then add our two standard ones - output & error ports
    // TODO: Remove this when this is available at the lower layers
    if ( _.isEmpty( nodeDef.outPorts ) ) {

        nodeDef = _.extend( nodeDef, 
                            { outPorts: {
                                output: {
                                    description: "noflo output port"
                                },
                                error: {
                                    description: "noflo error port"
                                }
                              }
                           }
                  );
    }

    return framework.componentFactory( nodeDef,
                                       { 
                                           fRunUpdater: fRunUpdater.bind( this, 
                                                                          nodeDef.updater, 
                                                                          updaterArgs ) 
                                           // TODO: Add other Wrapper API's here
                                       } 
           );

}; // module.exports

// Define a default updater stub function to be used if the caller 
// did not pass one in.  Simply returns whatever the original input was so it
// can be sent through the output port to the next component
var defaultUpdater = function() { 
    return { output: arguments };
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


if (process.env.NODE_ENV === 'test') {
  module.exports._private = { introspect: introspect };
} 
