// shex-wrapper.js

var _ = require('underscore');

var util = require('util');
var logger = require('./logger');
var createLm = require('./create-lm');
var createState = require('./create-state');
var factory = require('./pipeline-component-factory');
var wrapperHelper = require('./wrapper-helper');

var N3 = require("n3");
var jsonld = require("jsonld").promises;
var shexiface = require("../shex/shexiface");

/**
 * This module provides a Shex wrapper.  It is responsible for setting up the
 * component, and then invoking the RDF pipeline factory to complete building
 * the component and setting up the vni and state metadata.
 *
 * @param nodeDef
 *
 * @return a promise to create the noflo rdf component
 */
module.exports = function(nodeDef) {
    return factory({
        inPorts: _.isArray(nodeDef.inPorts) ?
            nodeDef.inPorts.map(function(obj) {
                if (_.isObject(obj)) {
                    return obj;
                }
                return {[obj]: {dataType: obj == 'input' ? 'all' : 'string'}};
            }).reduce(function(a,b){
                return _.extend(a, b);
            }, {
                input: {
                    dataType: 'all'
                }
            }) : nodeDef.inPorts || {
                input: {
                    dataType: 'all'
                }
            }
    }, {
        fRunUpdater: _.partial(fRunUpdater, nodeDef)
    });
};

/**
 * RDF Pipeline SHEX wrapper fRunUpdater API as documented here:
 *    https://github.com/rdf-pipeline/noflo-rdf-pipeline/wiki/Wrapper-API
 * This component takes json-ld on the input port and produces json-ld on the output port
 *
 * @param nodeDef
 * @param vni a virtual node instance
 */
function fRunUpdater(nodeDef, vni) {
    // Execute the updater on the VNI context
    return new Promise(function(resolve) {
        var input = vni.inputStates('input').data;
        if (nodeDef.preprocess)
            resolve(nodeDef.preprocess.call(vni, input));
        else
            resolve(input);
    }).then(jsonld_to_n3).then(function shexmap(fromGraph) {
        var makeTargetNode = _.partial(nodeDef.makeTargetNode, fromGraph);
        return shexiface(fromGraph, nodeDef.myTypeToShape, nodeDef.myBase,
		        nodeDef.staticBindings, makeTargetNode, nodeDef.targetFixup
	    ).then(function(dataAndLog) {
            return dataAndLog.data;
        });
    }).then(n3_to_jsonld.bind(this, nodeDef.vocab)).then(function(json) {
        if (nodeDef.postprocess)
            return nodeDef.postprocess.call(vni, json);
        else
            return json;
    }).then(function(json) {
        var groupLm = wrapperHelper.groupLm(vni.inputStates());
        vni.outputState({data: json, groupLm: groupLm, lm: createLm()});
    }).catch(function(e) {
        wrapperHelper.handleUpdaterException(vni, e);
    });
};

function jsonld_to_n3(json) {
    return jsonld.toRDF(json, {}).then(function(dataset) {
        var inGraph = N3.Store();
        _.each(dataset, function(triples, graphName) {
            _.each(triples, function(triple) {
                inGraph.addTriple({
                    subject: toN3(triple.subject),
                    predicate: toN3(triple.predicate),
                    object: toN3(triple.object),
                    graph: graphName == '@default' ? undefined : graphName
                });
            });
        });
        return inGraph;
    });
}

function toN3(term) {
    if (term.type != 'literal') return term.value;
    else return N3.Util.createLiteral(term.value, term.language || term.datatype);
}

function n3_to_jsonld(vocab, n3) {
    return new Promise(function(resolve) {
        resolve(n3.find(null, null, null));
    }).then(function(triples) {
        return jsonld.fromRDF(triples.reduce(function(dataset, triple) {
            var graph = triple.graph || '@default';
            dataset[graph] = dataset[graph] || [];
            dataset[graph].push({
                subject: fromN3(triple.subject),
                predicate: fromN3(triple.predicate),
                object: fromN3(triple.object)
            });
            return dataset;
        }, {'@default': []}), {});
    }).then(function(json) {
        if (!vocab) return json;
        var roots = _.uniq(n3.find(null, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", null)
            .map(triple => triple.subject)
            .filter(subject => _.isEmpty(n3.find(null, null, subject)))
        );
        return Promise.all(roots.map(root => {
            return jsonld.frame(json, {
                "@context": {
                  "@vocab": vocab,
                  "xsd": "http://www.w3.org/2001/XMLSchema#"
               },
               // find all the subjects not used as objects for the graph roots
               "@graph": [{'@id': root}]
            });
        })).then(docs => {
            return {
                "@context": {
                  "@vocab": vocab,
                  "xsd": "http://www.w3.org/2001/XMLSchema#"
               },
               // find all the subjects not used as objects for the graph roots
               "@graph": _.flatten(docs.map(doc => doc['@graph']), true)
            };
        });
    });
}

function fromN3(value) {
    if (value.indexOf('"') === 0) return {
        type: 'literal',
        value: N3.Util.getLiteralValue(value),
        language: N3.Util.getLiteralLanguage(value) || undefined,
        datatype: N3.Util.getLiteralType(value) || undefined
    };
    else if (value.indexOf('_:') === 0) return {
        type: 'blank node',
        value: value
    };
    else return {
        type: 'IRI',
        value: value
    };
}
