// writeFile.js

var _ = require('underscore');
var fs = require('fs');
var util = require('util');

var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper(writeFile);

/**
 * Writes the data to a specified file.  If the data is an object, it will be
 * inspected so that all details of the object will be written.
 *
 * @param filename path to the file to be written
 * @param data data content to be written
 *
 * @return file that was written
 */
function writeFile(filename, data) {

    if (_.isUndefined(filename) || _.isEmpty(filename)) {
        throw Error("WriteFile received no file name to write!");
    }

    if (_.isUndefined(data) || _.isEmpty(data)) {
        console.warn("WriteFile received no data content to write.");
    } else {
        if (_.isString(data) || isArrayOfStrings(data)) {
            fs.writeFileSync(filename, data);
        } else { 
            fs.writeFileSync(filename, util.inspect(data,{depth:null}));
        }
        return filename;
    }
}

function isArrayOfStrings(data) {

    if (!_.isArray(data)) return false;
    if (_.isEmpty(data)) return false;

    for (var i=0; i < data.length; i++) { 
        if (! _.isString(data[i])) return false;
    }

    return true;
}
