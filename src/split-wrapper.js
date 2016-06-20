// split-wrapper.js
var _ = require('underscore');

var util = require('util');
var logger = require('./logger');
var createLm = require('./create-lm');
var createState = require('./create-state');
var wrapper = require('./javascript-wrapper');
var wrapperHelper = require('./wrapper-helper');

/**
 *  Define a default updater stub function to be used if the caller
 * did not pass one in.  Simply returns whatever the original input was so it
 * can be sent through the output port to the next component
 *
 * @param vnid_hash hash of vnids and data values 
 */
function defaultUpdater(vnid_hash) {
    return vnid_hash;
}

function fRunUpdater(updater, updaterFormals, vni) {

    return new Promise(function( resolve ) {
        logger.debug('calling updater', vni);


        var results = wrapperHelper.executeUpdater(updater, 
                                                   updaterFormals, 
                                                   vni, 
                                                   _.partial( wrapperHelper.updateOutputState, vni));
        resolve(results);

    }).then( function(results) {
        logger.debug('updater returned results', {results: util.inspect(results), nodeInstance: vni.nodeInstance});

         if (! _.isUndefined(results)) {

             if (!_.isObject(results)) {
                 throw Error('Split wrapper requires a hash return from the updater');
             }

             // Update the output state with the content returned from the updater
             var states = vni.inputStates();
             var first = Object.keys(states)[0];
             var groupLm = states[first].lm;  // Get the LM of first port - that will be the group LM

             // Update output state but do NOT set the lm here - we don't want to send this
             // Sending is done below on each of the vnids and they get their timestamp then
             vni.outputState({data: results, groupLm: groupLm});  
            
             var hash = vni.outputState().data;
             var lm = createLm(); // Create an lm for the new vnis we will be sending 
             var outputPort = vni.nodeInstance.outPorts.output;

             // Walk the hash as returned by the updater, and generate each of the split nodes
             for (var vnid in hash) {
                 if (hash.hasOwnProperty(vnid)) {
                     var state = createState(vnid,     
                                             hash[vnid],  
                                             lm,   
                                             undefined, // no error
                                             undefined, // not stale
                                             groupLm); 
                     outputPort.sendIt(state);
                     logger.debug('sent', {state: state, nodeInstance: vni.nodeInstance});
                 }
             }
         }

    }).catch(function(e) {
        wrapperHelper.handleUpdaterException(vni, e);
    });
};

module.exports = function(nodeDefOrUpdater) {
    var overrideCallbacks = {defaultUpdater: defaultUpdater,
                             fRunUpdater: fRunUpdater};
    return wrapper(nodeDefOrUpdater, overrideCallbacks);
}
