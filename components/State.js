/**
 *  file: State.js
 */

var Lm = require('./Lm');

/**
 * Constructs and returns a new State object
 *
 * @param data the data to be stored in the state object.
 * @param lm (optional) the last modified timestamp (Lm) for the object. 
 *           See https://github.com/rdf-pipeline/framework/wiki/LM for more details.
 *           If the lm is undefined, a new lm will be generated.
 *
 * @return the newly created state object.
 */ 
module.exports = function( data, lm ) { 

       var stateLm = lm || Lm();
       return { data: data, 
                lm: stateLm };
};
