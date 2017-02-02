// replace-substring.js

var _ = require('underscore');
var wrapper = require('../src/javascript-wrapper.js');

/**
 * Replaces all occurances of the substring within the string 
 * @param string to be changed
 * @param old substring to be replaced
 * @parm new substring to replace the old substring 
 *
 * @return the modified string
 */
module.exports = 
    wrapper({description: "globally replaces a substring within string with the new substring",
             icon: 'language',
             transient: true,
             updater: replaceIt});

function replaceIt(string, old_substring, new_substring) {
    if (_.isEmpty(string) || _.isEmpty(old_substring) || _.isUndefined(new_substring)) 
       throw Error("Replace-substring component expects a target string, a substring to replace, and a replacement value!");

    var escaped_old_string = escapeRegExp(old_substring);
    return string.replace(new RegExp(escaped_old_string, 'g'), new_substring);
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}
