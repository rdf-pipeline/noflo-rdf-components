// rdf-jsonld.js

var _ = require('underscore');

var jsonld = require('jsonld').promises;

var dataUtils = require('./lib/data-utils');
var ttl2JsonLd = require('translators/lib/ttl-jsonld');
var wrapper = require('../src/javascript-wrapper.js');

/**
 * Converts the RDF graph input object into a JSON LD Graph object using an optional
 * frame on the corresponding component.
 *
 * @param input (required) RDF JS Interface Graph object
 * @param frame (optional) JSON-LD Frame object
 * @param filter_bnode_attrs (optional) an array with the attribute names that should be filtered if they
 *        hold a blank node name that is referenced only once.  Used when doing ShEx 
 *        translations of fields that would not be accessible after JSON-LD conversion to RDF
 *        such as id or _id.
 *
 * @see http://json-ld.org/spec/latest/json-ld-framing/
 */
module.exports = wrapper(rdfToJsonLd); 

function rdfToJsonLd(input, frame, filter_bnode_attrs) {
    var parsedInput = dataUtils.parseData(input, "Rdf-Jsonld component", "input"); 
 
    var parsedFrame = _.isUndefined(frame) ? frame : dataUtils.parseData(frame, "Rdf-Jsonld component", "frame");
    var parsedAttrs = _.isUndefined(filter_bnode_attrs) ? filter_bnode_attrs :  dataUtils.parseData(filter_bnode_attrs, "Rdf-Jsonld component", "filter bNode attributes");

    return ttl2JsonLd.rdfToJsonLd(parsedInput, parsedFrame, parsedAttrs);
}
