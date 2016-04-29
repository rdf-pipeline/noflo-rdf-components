// http-delivery.js

var _ = require('underscore');

var wrapper = require('../src/javascript-wrapper.js');

/**
 * This updater takes response content, response type, and a {req, res} pair as
 * input. It then writes the content and type to the response and returns the
 * input pair.
 */
module.exports = wrapper(function(content, type, input) {
    if (_.isArray(content)) {
        input.res.writeHead(200, 'OK', {
            'Content-Type': type || 'text/plain',
            'Content-Length': _.pluck(content, 'length').reduce(add, 0)
        });
        content.forEach(input.res.write.bind(input.res));
    } else if (_.isString(content)) {
        input.res.writeHead(200, 'OK', {
            'Content-Type': type || 'text/plain',
            'Content-Length': content.length
        });
        input.res.write(content);
    } else {
        var json = JSON.stringify(content);
        input.res.writeHead(200, 'OK', {
            'Content-Type': type || 'application/json',
            'Content-Length': json.length
        });
        input.res.write(json);
    }
    return input;
});

function add(a, b) {
    return a + b;
}
