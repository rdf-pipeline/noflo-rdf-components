// rdf-ntriples.js

var _ = require('underscore');

var logger = require('../src/logger');
var wrapper = require('../src/javascript-wrapper.js');

/**
 * Converts an RDF JS Interface Graph object into an object with the property
 * 'tokens' containing an Array of N-Triples tokens. tokens.join('') will produce an N-Triples string.
 * This is useful for AllegroGraph.
 * @param input RDF JS Interface Graph object
 * @see https://www.w3.org/TR/rdf-interfaces/#graphs
 */
module.exports = wrapper(function(input) {
    logger.debug('Enter', this);
    var tokens = [];
    input.forEach(function(triple) {
        tokens.push.apply(tokens, valueTokens(triple.subject));
        tokens.push(' ');
        tokens.push.apply(tokens, valueTokens(triple.predicate));
        tokens.push(' ');
        tokens.push.apply(tokens, valueTokens(triple.object));
        tokens.push(' .', '\n');
    });
    return tokens;
});

/**
 * Converts the RDF term into a array of tokens
 * @param term an RDF term implementing RDF JS Interface
 * @see https://www.w3.org/TR/rdf-interfaces/#basic-node-types
 */
function valueTokens(term) {
    var value = term.nominalValue;
    var encoded = encodingNeededFor(value) ? encode(value) : value;
    if (term.interfaceName === 'NamedNode') {
        if (encoded != value || value.indexOf('>') >= 0)
            throw Error("Invalid NamedNode: " + value);
        return ['<', encoded, '>'];
    } else if (term.interfaceName === 'BlankNode') {
        return [term.toString()];
    } else if (term.language) {
        if (encodingNeededFor(term.language))
            throw Error("Invalid Language: " + value);
        return ['"', encoded, '"@', term.language];
    } else if (term.datatype && term.datatype.toString() != 'http://www.w3.org/2001/XMLSchema#string') {
        var datatype = term.datatype.toString();
        if (encodingNeededFor(datatype) || datatype.indexOf('>') >= 0)
            throw Error("Invalid Datatype: " + datatype);
        return ['"', encoded, '"^^<', datatype, '>'];
    } else {
        return ['"', encoded, '"'];
    }
}

/**
 * Checks if the string includes any special characters.
 */
function encodingNeededFor(string) {
    return string.indexOf('\\') >= 0 || string.indexOf('\"') >= 0 ||
        string.indexOf('\n') >= 0 || string.indexOf('\r') >= 0 || string.indexOf('\t') >= 0;
}

/**
 * Returns an encoded version with backslash before special characters.
 */
function encode(string) {
    return string.replace(/([\t\n\r\"\\])/g, '\\$1');
}
