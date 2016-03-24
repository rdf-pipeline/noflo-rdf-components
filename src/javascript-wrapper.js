/**
 * File: javascript-wrapper.js 
 */
var _ = require('underscore');

var createLm = require('./create-lm');
var createState = require('./create-state');
var factory = require('./pipeline-component-factory');
var util = require('util');

/**
 * RDF Pipeline javascript wrapper fRunUpdater API as documented here: 
 *    https://github.com/rdf-pipeline/noflo-rdf-pipeline/wiki/Wrapper-API
 * 
 * @param updater component updater function
 * @param updaterArgs the introspected arguments found for the component updater.
 *        used to extract the input for the updater
 * @param vni a virtual node instance
 */
var fRunUpdater = function( updater, updaterArgs, vni ) {

    // Default to no updater parameters; if no arguments, we won't go through the map
    var updaterParameters = [];

    // Have one or more updater parameters - get them in the right order and pass them 
    updaterParameters = _.map( updaterArgs, function( arg ) { 
       var state = vni.inputStates( arg );
       if ( _.isUndefined( state ) ) { 
           return undefined;
       } else if (_.isArray( state )) { 
           // Have a parameter associated with a port with multiple inputs ->
           //  get an array of the data elements
           return _.pluck(state, 'data');
       } else if ( _.isObject( state ) ) {
           // Just one input on this port parameter - get it
           return state.data;
       } else {
           throw Error( "FRunupdater found an unexpected state: ", state );
       }
    });
    
    // Execute the updater on the VNI context, passing the updater Parameters as the API arguments
    return new Promise( function(resolve ) { 

         var results = updater.apply( vni, updaterParameters );
         if ( results !== null ) { 
             // If the updater returned anything, set the output state with it
             vni.outputState( createState( vni.vnid, results ) );
         } 
         resolve( results );

    }).catch( function( e ) { 
         var outputState = vni.outputState();
         if ( _.isUndefined( outputState.error ) || ! outputState.error  ) { 
             outputState.error = true;
             vni.outputState( outputState );
         } 
         vni.errorState( createState( vni.vnid, e.toString() ) );
    });

};

/**
 * This module provides a Javascript wrapper for updaters.  It is responsible for setting up the
 * code to ensure updater callback, and then invoking the RDF pipeline factory to complete building
 * the component and setting up the vni and state metadata.
 *
 * @param nodeDefOrUpdater 
 * @return a promise to create the noflo rdf component
 */
module.exports = function( nodeDefOrUpdater ) { 

    // Variables needed to create our pipeline component
    var updaterArgs;
    var updater;
    var nodeDef; 

    // Do we have an updater specified?  If not, use the default one
    if (_.isUndefined( nodeDefOrUpdater ) || _.isEmpty( nodeDefOrUpdater )) { 
        updater  = defaultUpdater;
    }

    if ( _.isFunction( nodeDefOrUpdater ) ) { 

        updater = nodeDefOrUpdater;
        updaterArgs = introspect( updater ); // get an array of updater parameter names in order
        // Convert array to a hash of ports with data type all
        var inPorts = ( _.isEmpty( updaterArgs ) ) ? { input: { datatype: 'all', required: true } } :
                      updaterArgs.reduce(function(map, obj) {
                          map[obj] = { datatype: 'all' };
                          return map;
                      }, {});
        nodeDef = { inPorts: inPorts,
                    updater: updater };

    } else { 

       // Have a classical component node definition - use it 
       nodeDef = nodeDefOrUpdater || {};

       // use default updater if we do not have one or nodeDef.updater if we do
       if ( _.isUndefined( nodeDef.updater ) || ! _.isFunction( nodeDef.updater )) { 
           updater = defaultUpdater;
       } else { 
	   updater = nodeDef.updater;
       }
       updaterArgs = introspect( updater );

       // Now merge the nodeDef inPorts definition with whatever is in our updater parameters
       // if there are any differences so we have all ports the updater may need from both 
       // the node definition and the updater API

       // Get node inPorts as a hash if it's not already
       var inPorts = ( _.isEmpty( nodeDef.inPorts ) ) ? {} : 
                               ( _.isArray( nodeDef.inPorts )) ? 
                                   nodeDef.inPorts.reduce( function( map, obj ) { 
                                       if ( _.isObject( obj ) ) { 
                                           return obj;
                                       }
                                       return { [obj]: {dataType: 'all'} };
                                    }, {})
                                  : nodeDef.inPorts;
       var inPortNames = Object.keys( inPorts );
       var undefinedInPortNames  = _.difference( updaterArgs, inPortNames );
       nodeDef.inPorts =  (_.isEmpty( undefinedInPortNames )) ? inPorts : 
                               _.defaults( inPorts,
                                           undefinedInPortNames.reduce(function(map, obj) {
                                               map[obj] = { datatype: 'all' };
                                               return map;
					       }, {}));
    }

    // TODO: Add additional wrapper functions to this object
    var wrapper = {fRunUpdater: _.partial( fRunUpdater, updater, updaterArgs)};
    return _.defaults(factory(nodeDef, wrapper), nodeDef);

}; // module.exports

/**
 *  Define a default updater stub function to be used if the caller 
 * did not pass one in.  Simply returns whatever the original input was so it
 * can be sent through the output port to the next component
 * 
 * @param input a default input port
 */
var defaultUpdater = function( input ) { 
    return input;
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

// If running in test mode, mocha will execute internal unit testing
if (process.env.NODE_ENV === 'test') {
  module.exports._private = { introspect: introspect };
} 
