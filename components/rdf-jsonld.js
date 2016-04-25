// rdf-jsonld.js

var _ = require('underscore');
var Promise = require('promise');
var jsonld = require('jsonld').promises;

var wrapper = require('../src/javascript-wrapper.js');

/**
 * Converts the given graph object into a JSON LD Graph object using an optional
 * frame on the corresponding Component.
 * @param input RDF JS Interface Graph object
 * @param frame JSON-LD Frame object
 */
module.exports = wrapper(function execute(input, frame) {
    return buildJSON(input).then(function(json) {
        if (frame) return jsonld.frame(json, frame);
        else if (json.length == 1) return json[0];
        else return json;
    });
});

/**
 * Promise of JSON-LD array of objects for the given graph.
 * @param graph RDF JS Interface Graph object
 */
function buildJSON(graph) {
    return new Promise(function(resolve) {
        var jsonGraph = []
        var subject = indexedSubject.bind(this, {}, jsonGraph);
        graph.forEach(function(triple) {
            var subj = subject(triple.subject);
            var pred = triple.predicate.nominalValue;
            var obj = objectValue(triple.object);
            pushTriple(subj, pred, obj);
        });
        resolve(jsonGraph);
    });
}

/**
 * Returns a JSON-LD object for the given subject using existing subjects were
 * possible.
 * @param subjects hash of existing subjects by their nominal value to their position in jsonGraph
 * @param jsonGraph array of existing subject objects
 * @param subject an RDF term implementing RDF JS Interface
 */
function indexedSubject(subjects, jsonGraph, subject) {
    var value = subject.nominalValue;
    if (typeof subjects[value] === 'undefined') {
        if (subject.interfaceName === 'BlankNode') {
            jsonGraph.push({
                '@id': subject.toString()
            });
        } else {
            jsonGraph.push({
                '@id': value
            });
        }
        subjects[value] = jsonGraph.length - 1;
    }
    return jsonGraph[subjects[value]];
}

/**
 * Converts the RDF term into a JSON-LD object
 * @param object an RDF term implementing RDF JS Interface
 */
function objectValue(object) {
    var value = object.nominalValue;
    if (object.interfaceName === 'NamedNode') {
        return {
            '@id': value
        };
    } else if (object.interfaceName === 'BlankNode') {
        return {
            '@id': object.toString()
        };
    } else if (object.language) {
        return {
            '@language': object.language,
            '@value': value
        };
    } else if (object.datatype && object.datatype.toString() != 'http://www.w3.org/2001/XMLSchema#string') {
        return {
            '@type': object.datatype.toString(),
            '@value': value
        };
    } else {
        return value;
    }
}

/**
 * Adds the key value to the given JSON-LD object.
 * @param object JSON-LD object
 * @param key the nominal value of the predicate
 * @param value the object value of the property as a JSON-LD object
 */
function pushTriple(object, key, value) {
    if (key === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
        if (typeof object['@type'] === 'undefined') {
            object['@type'] = [];
        }
        object['@type'].push(value['@id']);
    } else {
        if (typeof object[key] === 'undefined') {
            object[key] = value;
        } else {
            if (!Array.isArray(object[key])) {
                object[key] = [object[key]];
            }
            object[key].push(value);
        }
    }
}
