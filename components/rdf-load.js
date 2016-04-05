// rdf-load.js

var _ = require('underscore');
var Promise = require('promise');
var rdfstore = require('rdfstore');

var wrapper = require('../src/javascript-wrapper.js');

/**
 * Loads data into a RDF JS Interface Graph object
 * @param options A map of configuration options for the store
 * @param media Media type (application/json, text/n3...) of the data to be parsed or the value 'remote' if a URI for the data is passed instead
 * @param graph Graph URI template where the parsed triples will be inserted. If it is not specified, triples will be loaded in the default graph
 * @param input RDF data to be parsed and loaded or an URI where the data will be retrieved after performing content negotiation
 */
module.exports = wrapper(function(options, media, graph, input) {
    var graphURI = graph ? graph :
        _.isString(input) && !input.match(/[^\w%-._~:\/?#\[\]@!$&'()*+,;=]/) ?
        input : undefined;
    var type = media ? media :
        _.isString(input) ? 'remote' :
        _.isObject(input) ? 'application/json' : undefined;
    return denodeify(rdfstore, 'create', options || {}).then(function(store){
        return Promise.resolve().then(function(){
            if (type) {
                return denodeify(store, 'load', type, input, graphURI || {});
            }
        }).then(function(){
            if (graphURI) {
                return denodeify(store, 'graph', graphURI);
            } else {
                return denodeify(store, 'graph');
            }
        }).then(function(graph){
            graph.rdfstore = store;
            graph.graphURI = graphURI;
            return graph;
        });
    });
})

/**
 * Converts cb style async functions to promise style functions
 */
function denodeify(object, functionName /* arguments */) {
    var args = _.toArray(arguments).slice(2);
    return Promise.denodeify(object[functionName]).apply(object, args);
}
