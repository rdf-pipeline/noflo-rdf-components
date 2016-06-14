// stringify-json.js

var _ = require('underscore');

var wrapper = require('../src/javascript-wrapper.js');

/**
 * Stringify a JSON Object.
 * @param input JSON object
 */
module.exports = wrapper(function(input) {
    return JSON.stringify(input, null, 2);
});
