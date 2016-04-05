// object.js

var _ = require('underscore');

var wrapper = require('../src/javascript-wrapper.js');

/**
 * Creates a object from a key and value
 * @param key Property key
 * @param value Property value
 */
module.exports = wrapper(function(key, value) {
    if (!_.isEmpty(key) && !_.isUndefined(value))
        return _.object([key], [value]);
});
