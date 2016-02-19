// rdf-query.js

var _ = require('underscore');
var Promise = require('promise');
var Handlebars = require('handlebars');
var rdfstore = require('rdfstore');

var promiseOutput = require('../src/promise-output');
var componentFactory = require('../src/noflo-component-factory');

exports.getComponent = componentFactory({
    description: "Executes the given SPARQL query on the provided RDF graph and returns the result",
    icon: 'cog',
    outPorts: promiseOutput.outPorts,
    inPorts: {
        parameters: {
            description: "A map of template parameters",
            datatype: 'object',
            ondata: function(parameters) {
                this.nodeInstance.parameters = parameters;
            }
        },
        query: {
            description: "SPARQL query template string in handlebars syntax",
            datatype: 'string',
            required: true,
            ondata: function(query) {
                this.nodeInstance.query = Handlebars.compile(query);
            }
        },
        "default": {
            description: "Graph URI for the default dataset",
            datatype: 'string',
            ondata: function(defaultURI) {
                this.nodeInstance.defaultURIs = this.nodeInstance.defaultURIs || [];
                this.nodeInstance.defaultURIs.push(defaultURI);
            }
        },
        namespaces: {
            description: "Graph URI for the named dataset",
            datatype: 'string',
            ondata: function(namespacesURI) {
                this.nodeInstance.namespacesURIs = this.nodeInstance.namespacesURIs || [];
                this.nodeInstance.namespacesURIs.push(namespacesURI);
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


function execute(graph) {
    var self = this.nodeInstance;
    var query = self.query(self.parameters);
    var graphURI = graph.graphURI;
    var defaultURIs = _.compact([graphURI].concat(self.defaultURIs));
    var args = (self.defaultURIs || self.namespaceURIs || graphURI) ?
        [query, defaultURIs, self.namespaceURIs || []] : [query];
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
