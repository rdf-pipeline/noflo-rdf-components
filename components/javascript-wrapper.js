
/**
 * This file contacts the common code used by all of the variations of any RDF
 * node componentin the noflo implementation of the RDF Pipeline.
 */

var _ = require('underscore');
var stateComponent = require('./state-component');

/**
 * This module provides a Javascript wrapper for updaters.  It is responsible for setting up the
 * code to ensure updater callback, and then invoking the RDF pipeline framework to complete building
 * the component and setting up the vni and state metadata.
 *
 * @param def updater definition. This can be a simple updater function, or an object that contains 
 *        updater metadata (e.g., input/output port definitions, description, icons), and an updater.
 *
 * @return a promise to create the noflo rdf component
 */
module.exports = function(def) { 

    var self = this;

    if ( _.isUndefined(def) || ( _.isEmpty(def) && ! _.isFunction( def ))) { 
        // Nothing to work with - no metadata or updater - can't proceed.
        throw new Error('javascript-wrapper found no updater definition');
    }

    if ( _.isUndefined( def.updater ) && !_.isFunction(def)) { 
       // got called with def metadata, but no updater for this one
        return stateComponent( def );
    }
     
    // Have an updater - figure out the updater arguments 
    var updaterArgs = ( _.isFunction(def) ) ? introspect( def ) : introspect( def.updater );

    // Do we have any input port definition?  If we were only passed an updater function, we might not.
    // In that case, build the list of input port names from the updater function arguments.  We will 
    // assume that all arguments are input ports.
    if ( _.isFunction( def ) ) { 
        def = { updater: def, inPorts: updaterArgs };
    }

    // set up an onchange callback so we can invoke the updater when we have changes to process
    var updaterCallback = function() { 
        return function( state ) {

            // Do we have any updaterArgs?  We might not if we do not have source code
            if ( _.isEmpty( updaterArgs ) ) { 
               // No updaterArgs, so just pass the state
               def.updater.call( self, state );

            } else {
                // Have one or more parameters - get them in the right order and pass them 
                var parameters = _.map( updaterArgs, function( arg ) { 
                    var parameter = state[arg]; 
                    if ( _.isUndefined(parameter) && def.outPorts && def.outPorts.hasOwnProperty( arg ) ) {
                        // passing in the name of the output port - is this correct? 
                        parameter = arg;
                    }
                    return parameter; 
                });

                def.updater.apply( self, parameters );
            }
        }
    }

    return stateComponent( 
        _.defaults({
            onchange: updaterCallback()
        }, def)
      ); 

}; // module.exports

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
}

if (process.env.NODE_ENV === 'test') {
  module.exports._private = { introspect: introspect };
} 
