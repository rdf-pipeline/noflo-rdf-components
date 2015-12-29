// rdf-jsonld.js

var _ = require('underscore');
var Promise = require('promise');
var jsonld = require('jsonld').promises;
var noflo = require('noflo');

var basenode = require('./base-node');

exports.getComponent = function() {
    return _.extend(new noflo.Component({
        outPorts: {
            out: {
                description: "JSON LD Graph object",
                datatype: 'object'
            },
            error: {
                description: "Error object",
                datatype: 'object'
            }
        },
        inPorts: {
            frame: {
                description: "JSON-LD Frame object",
                datatype: 'object',
                process: basenode.on({data: basenode.assign('frame')})
            },
            'in': {
                description: "RDF JS Interface Graph object",
                datatype: 'object',
                required: true,
                process: basenode.on({data: execute})
            }
        }
    }), {
        description: "Converts an RDF JS Interface Graph object into a JSON LD Graph object",
        icon: 'edit'
    });
};

function execute(graph) {
    var outPorts = this.outPorts;
    var frame = this.frame;
    buildJSON(graph).then(function(json) {
        if (frame) return jsonld.frame(json, frame);
        else return json;
    }).then(function(json) {
        outPorts.out.send(json);
        outPorts.out.disconnect();
    }, function(err){
        outPorts.error.send(err);
        outPorts.error.disconnect();
    });
}

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
