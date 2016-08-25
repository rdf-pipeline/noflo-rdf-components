// simple-splitter.js
var _ = require('underscore');

var wrapper = require('../src/split-wrapper');

module.exports = wrapper({description: "splits a vnid hash, sending each of its elements "+
                                       "one at a time for parallel processing.  This component "+
                                       "should be matched with a join.",
                          icon: 'share-alt',
                          updater: updater});


/**
 * Custom updater for the splitter.  This one doesn't do much but the programmer could manipulate
 * the hash here prior to splitting the output if they like.  For example, they could add 
 * additional parameters or data to the hash values if desired. 
 * 
 * @param vnid_hash a hash with vnids as keys to the associated values to be processed separately.
 */
function updater(vnid_hash) {

    if (_.isUndefined(vnid_hash) || _.isEmpty(vnid_hash) || ! _.isObject(vnid_hash)) { 
        throw Error("Simple splitter component requires a vnid hash parameter!");
    }

    return vnid_hash;
}
