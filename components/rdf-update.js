// rdf-update.js

var _ = require('underscore');
var Promise = require('promise');
var Handlebars = require('handlebars');
var rdfstore = require('rdfstore');

var basenode = require('../src/base-node');
var promiseComponent = require('../src/promise-component');

exports.getComponent = promiseComponent({
    description: "Executes the given SPARQL update on the provided RDF graph and returns it",
    icon: 'cogs',
    inPorts: {
        parameters: {
            description: "A map of template parameters",
            datatype: 'object',
            ondata: basenode.assign('parameters')
        },
        update: {
            description: "SPARQL update template string in handlebars syntax",
            datatype: 'string',
            required: true,
            ondata: basenode.assign('update', Handlebars.compile)
        },
        "default": {
            description: "Graph URI for the Default Graph",
            datatype: 'string',
            ondata: basenode.assign('defaultURIs', basenode.push)
        },
        namespace: {
            description: "Graph URI for a Named Graph",
            datatype: 'string',
            ondata: basenode.assign('namespaceURIs', basenode.push)
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
    var update = this.update(this.parameters);
    var graphURI = graph.graphURI;
    var defaultURIs = _.compact([graphURI].concat(this.defaultURIs));
    var args = (this.defaultURIs || this.namespaceURIs || graphURI) ?
        [update, defaultURIs, this.namespaceURIs || []] : [update];
    return asRdfStore(graph).then(function(store){
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
