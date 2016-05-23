// replace-substring.js

var wrapper = require('../src/javascript-wrapper.js');

/**
 * Replaces all occurances of the substring within the string 
 * @param string to be changed
 * @param old substring to be replaced
 * @parm new substring to replace the old substring 
 *
 * @return the modified string
 */
module.exports = wrapper(function(string, old_substring, new_substring) {
    var escaped_old_string = escapeRegExp(old_substring);
    return string.replace(new RegExp(escaped_old_string, 'g'), new_substring);
});

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}
