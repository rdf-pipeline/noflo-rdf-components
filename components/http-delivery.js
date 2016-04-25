// http-delivery.js

var _ = require('underscore');

var wrapper = require('../src/javascript-wrapper.js');

/**
 * This updater takes response content, response type, and a {req, res} pair as
 * input. It then writes the content and type to the response and returns the
 * input pair.
 */
module.exports = wrapper(function(content, type, input) {
    if (type) input.res.writeHead(200, 'OK', {
        'Content-Type': type || 'text/plain',
        'Content-Length': content.length
    });
    input.res.write(content);
    return input;
});
