// object.js

var _ = require('underscore');

var wrapper = require('../src/javascript-wrapper.js');

/**
 * Creates a object from a key and value or array of keys and array of values
 * @param key Property key
 * @param value Property value
 */
module.exports = wrapper(function(key, value) {
    if (_.isEmpty(key) || _.isUndefined(value))
        return;
    else if (_.isArray(key) && _.isArray(value))
        return _.object(key, value);
    else
        return _.object([key], [value]);
});
