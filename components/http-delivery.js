// http-delivery.js

var _ = require('underscore');

var wrapper = require('../src/javascript-wrapper.js');

/**
 * This updater takes response content, response type, and a {req, res} pair as
 * request. It then writes the content and type to the response and returns the
 * request pair.
 */
module.exports = wrapper(function(content, type, request) {
    if (_.isArray(content)) {
        request.res.writeHead(200, 'OK', {
            'Content-Type': type || 'text/plain',
            'Content-Length': _.pluck(content, 'length').reduce(add, 0)
        });
        content.forEach(request.res.write.bind(request.res));
    } else if (_.isString(content)) {
        request.res.writeHead(200, 'OK', {
            'Content-Type': type || 'text/plain',
            'Content-Length': content.length
        });
        request.res.write(content);
    } else {
        var json = JSON.stringify(content);
        request.res.writeHead(200, 'OK', {
            'Content-Type': type || 'application/json',
            'Content-Length': json.length
        });
        request.res.write(json);
    }
    return request;
});

function add(a, b) {
    return a + b;
}
