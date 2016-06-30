// frame-jsonld.js

var _ = require('underscore');
var jsonld = require('jsonld').promises;

var wrapper = require('../src/javascript-wrapper.js');

/**
 * Converts the given JSON object into a JSON LD Graph object using an optional
 * frame and context. If a frame is provided it will be used to frame the json
 * object, parsed using the optional context. If a frame is not provided, but a
 * context object is provided, it will be used to compact  the json
 * object, parsed using the context if the json object doesn't have one.
 * Otherwise, the json object is returned.
 * @param input RDF JS Interface Graph object
 * @param frame JSON-LD Frame object
 * @param context JSON-LD Context object
 */
module.exports = wrapper(function execute(json, frame, context) {
    if (frame) return jsonld.frame(json, from, {documentLoader: function(url, cb) {
        if (context) return cb(null, {document: context});
        else return jsonld.documentLoaders.node()(url, cb);
    }});
    else if (context) return jsonld.compact(json, context, {documentLoader: function(url, cb) {
        if (_.isString(json['@context']))
            return cb(null, {documentUrl: json['@context']});
        else if (!_.isEmpty(json['@context'])) 
            return cb(null, {document: json['@context']});
        if (context)
            return cb(null, {document: context});
        else
            return jsonld.documentLoaders.node()(url, cb);
    }});
    else return json;
});
