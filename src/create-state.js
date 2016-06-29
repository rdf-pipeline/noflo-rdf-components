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
 *
 * @return the newly created state object.
 */ 
module.exports = function(vnid, data, lm, error, stale, groupLm) { 

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
                    lm: undefined };

       } 

       // Data and/or LM is not undefined - so use the lm or create a new one if we do 
       // not have an lm
       return { vnid: vnid,
                data: data, 
                error: error,
                stale: stale,
                groupLm: groupLm,
                lm: lm || createLm() };
};

module.exports.STATE_KEYS = ['vnid', 'data', 'error', 'stale', 'groupLm', 'lm'];
