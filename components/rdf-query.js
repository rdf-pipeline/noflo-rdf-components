// rdf-query.js

var _ = require('underscore');
var Promise = require('promise');
var Handlebars = require('handlebars');
var rdfstore = require('rdfstore');

var basenode = require('./base-node');
var promiseComponent = require('./promise-component');

exports.getComponent = promiseComponent({
    description: "Executes the given SPARQL query on the provided RDF graph and returns the result",
    icon: 'cog',
    resolvePort: {
        name: 'out',
        description: "Query result",
        datatype: 'object'
    },
    rejectPort: {
        name: 'error',
        description: "Error object",
        datatype: 'object'
    },
    inPorts: {
        parameters: {
            description: "A map of template parameters",
            datatype: 'object',
            ondata: basenode.assign('parameters')
        },
        query: {
            description: "SPARQL query template string in handlebars syntax",
            datatype: 'string',
            required: true,
            ondata: basenode.assign('query', Handlebars.compile)
        },
        "default": {
            description: "Graph URI for the default dataset",
            datatype: 'string',
            ondata: basenode.assign('defaultURIs', basenode.push)
        },
        namespaces: {
            description: "Graph URI for the named dataset",
            datatype: 'string',
            ondata: basenode.assign('namespacesURIs', basenode.push)
        },
        'in': {
            description: "RDF JS Interface Graph object",
            datatype: 'object',
            required: true,
            ondata: execute
        }
    }
});


function execute(graph) {
    var outPorts = this.outPorts;
    var query = this.query(this.parameters);
    var graphURI = graph.graphURI;
    var defaultURIs = _.compact([graphURI].concat(this.defaultURIs));
    var args = (this.defaultURIs || this.namespaceURIs || graphURI) ?
        [query, defaultURIs, this.namespaceURIs || []] : [query];
    return asRdfStore(graph).then(function(store){
        return Promise.denodeify(store.execute).apply(store, args);
    });
}

function asRdfStore(graph) {
    if (graph.rdfstore) return Promise.resolve(graph.rdfstore);
    else return denodeify(rdfstore, 'create', {}).then(function(store){
        return Promise.resolve(graph).then(function(graph){
            if (!graph.graphURI) return denodeify(store, 'insert', graph);
            else return denodeify(store, 'insert', graph, graph.graphURI);
        }).then(_.constant(store));
    });
}

function denodeify(object, functionName /* arguments */) {
    var args = _.toArray(arguments).slice(2);
    return Promise.denodeify(object[functionName]).apply(object, args);
}
