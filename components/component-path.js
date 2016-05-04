// component-path.js

var _ = require('underscore');
var path = require('path');
var fs = require('fs');

var wrapper = require('../src/javascript-wrapper.js');

/**
 * Receives a filename (relative to this module) on the filename port, and sends
 * the full canonical path to the file to the output port. In case of errors the
 * error message will be sent to the error port.
 *
 * @param filename Filename (absolute or relative to this module)
 */
module.exports = wrapper(function(filename) {
    return path.resolve(__dirname, '..', filename);
});
