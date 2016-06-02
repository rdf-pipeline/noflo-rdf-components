// zip.js

var _ = require('underscore');

var wrapper = require('../src/javascript-wrapper.js');

/**
 * Merges together one of the values of the array with the given value
 * @param array Array of values to choose from
 * @param value to include in output
 * @return an Array consistent of an item from array and value
 */
module.exports = wrapper(function(array, value) {
    if (_.isEmpty(array) || _.isUndefined(value))
        return;
    return [array[choose(value, array.length)], value];
});

function choose(value, len) {
    var code = hashCode(JSON.stringify(value));
    return (code % len + len) % len;
}

function hashCode(str){
    var hash = 0, i, char;
    if (str.length === 0) return hash;
    for (i = 0, l = str.length; i < l; i++) {
        char = str.charCodeAt(i);
        hash = char + (hash << 6) + (hash << 16) - hash;
    }
    return hash;
}
