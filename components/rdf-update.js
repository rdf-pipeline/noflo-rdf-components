// rdf-update.js

var _ = require('underscore');
var Promise = require('promise');
var Handlebars = require('handlebars');
var rdfstore = require('rdfstore');

var wrapper = require('../src/javascript-wrapper.js');

/**
 * Executes the given SPARQL update on the provided RDF graph and returns it
 */
module.exports = wrapper({
    description: "Executes the given SPARQL update on the provided RDF graph and returns it",
    icon: 'cogs',
    inPorts: {
        parameters: {
            description: "A map of template parameters",
            datatype: 'object',
            multi: true
        },
        update: {
            description: "SPARQL update template string in handlebars syntax",
            datatype: 'string'
        },
        default_uri: {
            description: "Graph URI for the Default Graph",
            datatype: 'string',
            multi: true
        },
        namespace_uri: {
            description: "Graph URI for a Named Graph",
            datatype: 'string',
            multi: true
        },
        input: {
            description: "RDF JS Interface Graph object",
            datatype: 'object'
        }
    },
    updater: execute
});

/**
 * Executes the given SPARQL update on the provided RDF graph and returns it
 * @param parameters A array of maps of template parameters
 * @param update SPARQL update template string in handlebars syntax
 * @param default_uri An array of Graph URI for the Default Graph
 * @param namespace_uri An array of Graph URI for a Named Graph
 * @param input RDF JS Interface Graph object
 */
function execute(parameters, update, default_uri, namespace_uri, input) {
    var param = _.extend.apply(_, [{}].concat(parameters));
    var update_str = Handlebars.compile(update)(param);
    var graphURI = input.graphURI;
    var defaultURIs = _.compact(_.flatten([graphURI].concat(default_uri)));
    var args = (default_uri || namespace_uri || graphURI) ?
        [update_str, defaultURIs, _.flatten(namespace_uri) || []] : [update_str];
    return asRdfStore(input).then(function(store){
        return Promise.denodeify(store.execute).apply(store, args).then(function(){
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
}

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
