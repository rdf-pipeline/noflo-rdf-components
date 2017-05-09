// join-array.js
//
// Joins an array of strings into a single string.
//
// There is a noflo join component, but in the recent versions, it treats an empty input 
// delimiter as an error. There are situations where we want to simply join something with 
// no value, e.g., when joining an array of string that are already terminated with a new line. 
// This component lets us do it.  Some tests and graphs rely on this.

var _ = require('underscore');

var wrapper = require('../src/javascript-wrapper.js');
var logger = require('../src/logger');

module.exports = 
    wrapper({description: "joins all elements of an array (or an array-like object) into a string.",
             icon: 'compress',
             transient: true,
             updater: joinIt});

/**
 * Joins an array of values with the specified delimiter; if no delimiter is
 * provided, a comma will be used as the delimiter.
 * 
 * @param input data to be joined
 * @param delimiter delimiter to use in joining the data elements; defaults to a comma.
 */
function joinIt(input, delimiter) {

    if (_.isEmpty(input)) { 
        logger.warn('Unable to join empty input');
        return input;

    } else if (_.isArray(input)) { 
        delimiter = _.isUndefined(delimiter) ? ',' : delimiter;
        return input.join(delimiter);
    } 

    throw Error('Cannot join non-array input:', input);
}
