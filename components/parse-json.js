// parse-json.js

var _ = require('underscore');

var wrapper = require('../src/javascript-wrapper.js');

/**
 * Parses a string as JSON.
 * @param input JSON formatted string
 */
module.exports = wrapper(function(input) {
    return JSON.parse(input);
});
