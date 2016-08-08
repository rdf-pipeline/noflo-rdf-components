/**
 *  file: create-state.js
 */

var _ = require('underscore');

var createLm = require('./create-lm');

/**
 * Constructs and returns a new State object
 *
 * @param vnid virtual node id
 * @param data the data to be stored in the state object.
 * @param error {boolean} if true, an error processing data has occurred on this component
 * @param stale {boolean} if true, an upstream node had an error, making data for this
 *              component stale
 * @param groupLm the LM of data that has been split for processing across multiple components
 *                in parallel and will be re-joined downstream
 * @param lm (optional) the last modified timestamp (Lm) for the object. 
 *           See https://github.com/rdf-pipeline/framework/wiki/LM for more details.
 *           If the lm is undefined, a new lm will be generated.
 * @param componentName the name of the component to which this state belongs
 *
 * @return the newly created state object.
 */ 
module.exports = function(vnid, data, lm, error, stale, groupLm, componentName) { 

       if (_.isUndefined(vnid)) {
           throw new Error("Unable to create state because no vnid was provided");
       }

       var stateLm;
       if (_.isUndefined(data) && _.isUndefined(lm)) { 
           // If both data & lm are undefined, we are initializing - accept an undefined lm
           return { vnid: vnid,
                    data: undefined, 
                    error: undefined,
                    stale: undefined,
                    groupLm: undefined,
                    lm: undefined,
                    componentName: componentName || '' };

       } 

       // Data and/or LM is not undefined - so use the lm or create a new one if we do 
       // not have an lm
       return { vnid: vnid,
                data: data, 
                error: error,
                stale: stale,
                groupLm: groupLm,
                lm: lm || createLm(),
                componentName: componentName || '' };
};

module.exports.STATE_KEYS = ['vnid', 'data', 'error', 'stale', 'groupLm', 'lm', 'componentName'];

/**
 * Clear all metadata in the specified state
 */
module.exports.clearMetadata = function(state) {
    if (!_.isEmpty(state)) {
        var self = this;
        _.keys(state).forEach(function(key) {
            if (!_.contains(self.STATE_KEYS, key)) {
                delete state[key];
            }
        });
    }
}

/**
 * Copy the metadata from one state to another state
 * 
 * @param from state from which metadata should be copied
 * @param to state to which metadata should be copied
 */
module.exports.copyMetadata = function(from, to) {
    var self = this;
    _.keys(from).forEach(function(key) {
         if (!_.contains(self.STATE_KEYS, key))
             to[key] = from[key];
    });
}
