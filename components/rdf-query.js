// rdf-query.js

var _ = require('underscore');
var Promise = require('promise');
var Handlebars = require('handlebars');
var rdfstore = require('rdfstore');

var wrapper = require('../src/javascript-wrapper.js');

/**
 * Executes the given SPARQL query on the provided RDF graph and returns the result
 */
module.exports = wrapper({
    description: "Executes the given SPARQL query on the provided RDF graph and returns the result",
    icon: 'cog',
    inPorts: {
        parameters: {
            description: "A map of template parameters",
            datatype: 'object',
            multi: true
        },
        query: {
            description: "SPARQL query template string in handlebars syntax",
            datatype: 'string'
        },
        default_uri: {
            description: "Graph URI for the default dataset",
            datatype: 'string',
            multi: true
        },
        namespace_uri: {
            description: "Graph URI for the named dataset",
            datatype: 'all',
            multi: true
        },
        input: {
            description: "RDF JS Interface Graph object",
            datatype: 'object'
        }
    },
    updater: function(parameters, query, default_uri, namespace_uri, input) {
        var param = _.extend.apply(_, [{}].concat(parameters));
        var query_str = Handlebars.compile(query)(param);
        var graphURI = input.graphURI;
        var defaultURIs = _.compact(_.flatten([graphURI].concat(default_uri)));
        var args = (default_uri || namespace_uri || graphURI) ?
            [query_str, defaultURIs, _.flatten(namespace_uri) || []] : [query_str];
        return asRdfStore(input).then(function(store){
            return Promise.denodeify(store.execute).apply(store, args);
        });
    }
});

/**
 * Converts the given graph into an rdfstore object
 * @param graph RDF JS Interface Graph object
 */
function asRdfStore(graph) {
    if (graph.rdfstore) return Promise.resolve(graph.rdfstore);
    else return denodeify(rdfstore, 'create', {}).then(function(store){
        return Promise.resolve(graph).then(function(graph){
            if (!graph.graphURI) return denodeify(store, 'insert', graph);
            else return denodeify(store, 'insert', graph, graph.graphURI);
        }).then(_.constant(store));
    });
}

/**
 * Converts cb style async functions to promise style functions
 */
function denodeify(object, functionName /* arguments */) {
    var args = _.toArray(arguments).slice(2);
    return Promise.denodeify(object[functionName]).apply(object, args);
}
