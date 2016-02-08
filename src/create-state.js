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
 * @param lm (optional) the last modified timestamp (Lm) for the object. 
 *           See https://github.com/rdf-pipeline/framework/wiki/LM for more details.
 *           If the lm is undefined, a new lm will be generated.
 *
 * @return the newly created state object.
 */ 
module.exports = function( vnid, data, lm ) { 

       if ( _.isUndefined( vnid) ) {
           throw new Error("Unable to create state because no vnid was provided");
       }

       var stateLm = lm || createLm();
       return { vnid: vnid,
                data: data, 
                lm: stateLm };
};