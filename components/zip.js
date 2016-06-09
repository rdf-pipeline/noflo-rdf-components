// zip.js

var _ = require('underscore');

var wrapper = require('../src/javascript-wrapper.js');

/**
 * Merges together one of the values of the array with the given value.
 * Selects one member of an array based on the hashcode of a given value.
 * This is used in load balancing, to distribute requests across an array of
 * available servers, where the value is a vnid. Hashing is used to ensure
 * that the same server is used for subsequent requests for the same vnid
 * (provided that the server list does not change).
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

/**
 * This algorithm was created for sdbm (a public-domain reimplementation of ndbm) database library.
 * the function is hash(i) = hash(i - 1) * 65599 + str[i]; while the magic constant 65599 was picked
 * out of thin air while experimenting with different constants, it turns out to be a prime number.
 * This is one of the algorithms used in berkeley db and elsewhere.
 * @see http://erlycoder.com/49/javascript-hash-functions-to-convert-string-into-integer-hash-
 */
function hashCode(str){
    var hash = 0, i, char;
    if (str.length === 0) return hash;
    for (i = 0, l = str.length; i < l; i++) {
        char = str.charCodeAt(i);
        hash = char + (hash << 6) + (hash << 16) - hash;
    }
    return hash;
}
