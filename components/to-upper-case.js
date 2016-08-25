// to-upper-case.js
var _ = require('underscore');

var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper({description: "Converts a string to upper case",
                          icon: 'arrow-up',
                          updater: toUpperCase});

function toUpperCase(string) {

    if (_.isUndefined(string) || ! _.isString(string)) {
        throw Error("toUppercase requires an input string parameter!");
    }

    return string.toUpperCase();
}
