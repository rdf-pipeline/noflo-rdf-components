// simple-join.js
var _ = require('underscore');

var wrapper = require('../src/join-wrapper');

module.exports = wrapper(updater);

/**
 * Simple join component updater.  This component can be used to make final changes to either 
 * the vnid hash or the input prior to processing it back into the final joined hash
 *
 * @param vnid_hash a hash with vnids as keys to the associated values to be processed separately.
 */
function updater(vnid_hash, input) {

    if (_.isUndefined(vnid_hash) || _.isEmpty(vnid_hash) || ! _.isObject(vnid_hash)) {
        throw Error("Simple join component requires a vnid hash parameter!");
    }

    return {vnid_hash: vnid_hash, 
            input: input};
}
