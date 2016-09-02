// write-content.js

var _ = require('underscore');
var path = require('path');
var fs = require('fs');

var wrapper = require('../src/javascript-wrapper.js');

/**
 * Receives a filename (relative to this module) on the filename port, and writes data
 * to this file with the specified options.
 *
 * @param filename Filename (absolute or relative to this module)
 * @param data data to be written
 * @param options node writeFile API options; defaults to utf-8 if undefined
 *
 * @return a promise to return either an error, or the absolute path to the 
 *         file that was written if successful.
 */
module.exports = wrapper(function(filename, data, options) {

    if (_.isEmpty(filename)) throw Error("Write content component requires a file name!");

    var absolute = path.resolve(__dirname, '..', filename);
    var content = _.isUndefined(data) ? '' : data;
    if (_.isObject(content)) { 
        content = JSON.stringify(content);
    }

    return new Promise(function(resolve, reject){

        return fs.writeFile(absolute, content, options, function(err, content){
            if (err) reject(err);
            resolve(absolute);
        });
    });

});
