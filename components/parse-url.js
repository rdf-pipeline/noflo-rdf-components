// parse-url.js

var _ = require('underscore');
var url = require('url');

var wrapper = require('../src/javascript-wrapper.js');

/**
 * Parses the url at /req/url extend the input with {href, protocol, slashes,
 * host, auth, hostname, port, pathname, search, path, query, hash}.
 */
module.exports = wrapper(function(input) {
    return _.extend(input, url.parse(input.req.url, true));
});
