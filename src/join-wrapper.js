// join-wrapper.js

// Implements a join wrapper as per RDF-pipeline wrapper definition
// https://github.com/rdf-pipeline/noflo-rdf-pipeline/wiki/Wrapper-API
// 
// A join wrapper is usually used in conjunction with the split wrapper. 
// The split step takes a hash and splits it into many pieces, sending it 
// through one or more parallel steps.  The join wrapper receives the hash 
// and the results of split processing and puts it back together again.
//
// This is an initial version that we should revisit when we have a clearer 
// use case and design for how split and join should work.

var _ = require('underscore');
var util = require('util');

var logger = require('./logger');
var createLm = require('./create-lm');
var createState = require('./create-state');
var wrapper = require('./javascript-wrapper');
var wrapperHelper = require('./wrapper-helper');

var splitJoinHash = {};

module.exports = function(nodeDefOrUpdater) {
    var overrideCallbacks = {defaultUpdater: defaultUpdater,
                             fRunUpdater: fRunUpdater};
    return wrapper(nodeDefOrUpdater, overrideCallbacks);
}

/**
 * Define a default join component updater.  This component can be used to make final changes to either
 * the vnid hash or the input prior to processing it back into the final joined hash
 *
 * @param vnid_hash a hash with vnids as keys to the associated values to be processed separately.
 * @param input input from the split pipeline
 */
function defaultUpdater(vnid_hash, input) {

    return {vnid_hash: vnid_hash,
            input: input};
}

var fRunUpdater = function(updater, updaterFormals, vni, payload) {

    // Just received hash (which has no group lm), but no input, so there's nothing to do yet 
    if (_.isUndefined(payload.groupLm)) return;

    // We have an input with data that went through the split chain
    var hashState = getHashState(vni, payload);
    var groupLm = wrapperHelper.groupLm(vni.inputStates());

    // Is this the first time we've seen data from this split group?
    if (_.isUndefined(splitJoinHash[groupLm])) {

        // Got a new hash so create an entry for tracking it and mark all hash fields pending
        splitJoinHash[groupLm] = _.mapObject(hashState.data, function(val, key) {
            return {[key]: val, pending: true};
        });
    }

    var oldOutputStateLm = vni.outputState().lm;
    vni.outputState({error: undefined});

    return new Promise(function( resolve ) {
        logger.debug('calling updater', vni);

        // Call the updater so the component can do whatever the user wants with the hash and input data
        var results = wrapperHelper.executeUpdater(updater, 
                                                   updaterFormals, 
                                                   vni, 
                                                   _.partial( wrapperHelper.updateOutputState, vni));
        resolve(results);

    }).then( function(results) {
        logger.debug('updater returned results', {results: util.inspect(results), nodeInstance: vni.nodeInstance});

        if (! _.isUndefined(results)) {
            // Got some results back from updater
            // If the updater returned anything, set the output state with it
            var newStateLm = vni.outputState().lm;
            if (newStateLm === oldOutputStateLm ||
                _.isUndefined(oldOutputStateLm) && ! _.isUndefined(newStateLm)) {

                var hash = splitJoinHash[groupLm];
                var vnid = vni.vnid;
                hash[vnid] = _.isUndefined(results.input) ? results : results.input; 
       
                if (haveAll(hash)) {
                    vni.outputState({vnid: hashState.vnid, data: hash, lm: createLm()});
                }
            }
        }

     }).catch(function(e) {
         wrapperHelper.handleUpdaterException(vni, e);
     });
};

/**
 * Given a vni, this function will attempt to deduce which argument is the hash.
 * The hash argument can usually be identified because it will have an lm, but no group lm.  
 * It's lm should be the grouplm of the other inputs.  
 *
 * @param vni 
 * @param payload
 *
 * @return the hash vni associated with this request.
 */
function getHashState(vni, payload) { 
    var states = vni.inputStates();
    
    // Look for the input that does NOT have a groupLM defined.  That should be the hash.  
    var possibleHashes = _.where(states, {groupLm: undefined});
    if (_.isEmpty(possibleHashes)) { 
        throw Error("Join wrapper found no hash input to join"); 
    }

    // Do we have a hash that matches the payload?  If it matches, the
    // payload group LM should equal the hash's lm
    for (var i=0, max=possibleHashes.length; i < max; i++) {
        if (payload.groupLm && payload.groupLm === possibleHashes[i].lm)  {
            return possibleHashes[i];
        } 
    }

    // Did not find a hash that matches that payload - throw an error
    throw Error("Join wrapper found no hash defined.");
}

/**
 * Check to see if all hash entries have been received yet or not.  We will know when
 * none of them have the pending flag any more.
 *
 * @param hash 
 *
 * @return true if we have received all inputs for the hash
 */
function haveAll(hash) { 
    return ! _.reduce( _.pluck(hash, 'pending'), function( memo, val) { return memo || val });
}

