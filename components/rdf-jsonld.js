// rdf-jsonld.js

var _ = require('underscore');
var Promise = require('promise');
var jsonld = require('jsonld').promises;

var promiseOutput = require('../src/promise-output');
var componentFactory = require('../src/noflo-component-factory');

/**
 * Converts an RDF JS Interface Graph object into a JSON LD Graph object
 */
exports.getComponent = componentFactory({
    description: "Converts an RDF JS Interface Graph object into a JSON LD Graph object",
    icon: 'edit',
    outPorts: promiseOutput.outPorts,
    inPorts: {
        frame: {
            description: "JSON-LD Frame object",
            datatype: 'object',
            ondata: function(frame) {
                this.nodeInstance.frame = frame;
            }
        },
        input: {
            description: "RDF JS Interface Graph object",
            datatype: 'object',
            required: true,
            ondata: promiseOutput(execute)
        }
    }
});

/**
 * Converts the given graph object into a JSON LD Graph object using an optional
 * frame on the corresponding Component.
 * @this a noflo.InPort or facade
 * @param graph RDF JS Interface Graph object
 */
function execute(graph) {
    var frame = this.nodeInstance.frame;
    return buildJSON(graph).then(function(json) {
        if (frame) return jsonld.frame(json, frame);
        else return json;
    });
}

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
                '@id': '_:' + value
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
            '@id': '_:' + value
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
