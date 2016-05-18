// read-content.js

var _ = require('underscore');
var path = require('path');
var fs = require('fs');

var wrapper = require('../src/javascript-wrapper.js');

/**
 * Receives a filename (relative to this module) on the filename port, and sends
 * the contents of the specified file to the output port. In case of errors the
 * error message will be sent to the error port.
 * @param filename Filename (absolute or relative to this module)
 * @param encoding Character encoding
 */
module.exports = wrapper(function(filename, encoding) {
    var absolute = path.resolve(__dirname, '..', filename);
    return new Promise(function(resolve, reject){
        return fs.readFile(absolute, encoding || 'utf-8', function(err, content){
            if (err) reject(err);
            else resolve(content);
        });
    });
});
