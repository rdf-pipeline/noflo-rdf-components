/**
 * File: javascript-wrapper.js 
 */
var _ = require('underscore');

var util = require('util');
var logger = require('./logger');
var createLm = require('./create-lm');
var createState = require('./create-state');
var factory = require('./pipeline-component-factory');
var wrapperHelper = require('./wrapper-helper');

/**
 * RDF Pipeline javascript wrapper fRunUpdater API as documented here: 
 *    https://github.com/rdf-pipeline/noflo-rdf-pipeline/wiki/Wrapper-API
 * 
 * @param updater component updater function
 * @param updaterFormals the introspected arguments found for the component updater.
 *        used to extract the input for the updater
 * @param vni a virtual node instance
 */
var fRunUpdater = function(updater, updaterFormals, vni) {

    var updaterActuals = wrapperHelper.getUpdaterParameters(vni, updaterFormals);

    var oldOutputStateLm = vni.outputState().lm;
    vni.outputState({error: undefined});
    var groupLm = wrapperHelper.groupLm(vni.inputStates());

    // Execute the updater on the VNI context, passing the updater Parameters as the API arguments
    return new Promise(function(resolve) { 
        logger.debug('calling updater', vni);

         var results = updater.apply(vni, updaterActuals);
         resolve(results);

     }).then(function(results) { 
         logger.debug('updater returned results', {results: util.inspect(results), nodeInstance: vni.nodeInstance});

         if (! _.isUndefined(results)) {
             // Got some results back from updater
             // If the updater returned anything, set the output state with it
             var newStateLm = vni.outputState().lm;
             if (newStateLm === oldOutputStateLm ||
                 _.isUndefined(oldOutputStateLm) && ! _.isUndefined(newStateLm)) {

                 // updater did not modify output state lm - update it now
                 vni.outputState({data: results, groupLm: groupLm, lm: createLm()});
             }
         }

    }).catch(function(e) { 
        wrapperHelper.handleUpdaterException(vni, e);
    });
};

/**
 * This module provides a Javascript wrapper for updaters.  It is responsible for setting up the
 * code to ensure updater callback, and then invoking the RDF pipeline factory to complete building
 * the component and setting up the vni and state metadata.
 *
 * @param nodeDefOrUpdater 
 * @param overrides 
 *
 * @return a promise to create the noflo rdf component
 */
module.exports = function(nodeDefOrUpdater, overrides) { 

    // Variables needed to create our pipeline component
    var updaterArgs;
    var nodeDef; 

    var callbacks = _.isUndefined(overrides) ? {} : overrides; 
    var updater = (!_.isUndefined(callbacks.defaultUpdater)) ? callbacks.defaultUpdater : defaultUpdater;

    if (_.isFunction(nodeDefOrUpdater)) { 

        updater = nodeDefOrUpdater;
        updaterArgs = introspect(updater); // get an array of updater parameter names in order
        // Convert array to a hash of ports with data type all
        var inPorts = (_.isEmpty(updaterArgs)) ? { input: { datatype: 'all', required: true } } :
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
       if ((! _.isUndefined(nodeDef.updater)) && _.isFunction(nodeDef.updater)) { 
	   updater = nodeDef.updater;
       }
       updaterArgs = introspect(updater);

       // Now merge the nodeDef inPorts definition with whatever is in our updater parameters
       // if there are any differences so we have all ports the updater may need from both 
       // the node definition and the updater API

       // Get node inPorts as a hash if it's not already
       var inPorts = (_.isEmpty(nodeDef.inPorts)) ? {} : 
                               (_.isArray(nodeDef.inPorts)) ? 
                                   nodeDef.inPorts.reduce(function(map, obj) { 
                                       if (_.isObject(obj)) { 
                                           return obj;
                                       }
                                       return { [obj]: {dataType: 'all'} };
                                    }, {})
                                  : nodeDef.inPorts;
       var inPortNames = Object.keys(inPorts);
       var undefinedInPortNames  = _.difference(updaterArgs, inPortNames);
       nodeDef.inPorts =  (_.isEmpty(undefinedInPortNames)) ? inPorts : 
                               _.defaults(inPorts,
                                           undefinedInPortNames.reduce(function(map, obj) {
                                               map[obj] = { datatype: 'all' };
                                               return map;
					       }, {}));
    }

    // TODO: Add additional wrapper functions to the wrapper object
    if (!_.isUndefined(callbacks.fRunUpdater)) { 
       callbacks = {fRunUpdater: _.partial(callbacks.fRunUpdater, updater, updaterArgs)}; 
    }
    var wrapper = _.defaults(callbacks, 
                             {fRunUpdater: _.partial(fRunUpdater, updater, updaterArgs)});
    return _.defaults(factory(nodeDef, wrapper), nodeDef);

}; // module.exports

/**
 *  Define a default updater stub function to be used if the caller 
 * did not pass one in.  Simply returns whatever the original input was so it
 * can be sent through the output port to the next component
 * 
 * @param input a default input port
 */
var defaultUpdater = function(input) { 
    return input;
}

// Introspect the updater to determine what its parameters are.
// The algorithm here comes from the following sources:
//  - http://stackoverflow.com/questions/6921588/is-it-possible-to-reflect-the-arguments-of-a-javascript-function#answer-13660631
//  - https://github.com/angular/angular.js/blob/master/src/auto/injector.js
var introspect = function(fn) {

    var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
    var FN_ARG_SPLIT = /,/;
    var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
    var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
  
    try {
        var fnText = fn.toString().replace(STRIP_COMMENTS, '');
        var argDecl = fnText.match(FN_ARGS);
        var rawArgs = argDecl[1].split(FN_ARG_SPLIT);

        var args = []; // default to no args
        if (! _.isEqual(rawArgs, [''])) { 
            // Got some args so extract them
            args = _.map(rawArgs, function(arg) { 
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
