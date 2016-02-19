// rdf-update.js

var _ = require('underscore');
var Promise = require('promise');
var Handlebars = require('handlebars');
var rdfstore = require('rdfstore');

var promiseOutput = require('../src/promise-output');
var componentFactory = require('../src/noflo-component-factory');

exports.getComponent = componentFactory({
    description: "Executes the given SPARQL update on the provided RDF graph and returns it",
    icon: 'cogs',
    outPorts: promiseOutput.outPorts,
    inPorts: {
        parameters: {
            description: "A map of template parameters",
            datatype: 'object',
            ondata: function(parameters) {
                this.nodeInstance.parameters = parameters;
            }
        },
        update: {
            description: "SPARQL update template string in handlebars syntax",
            datatype: 'string',
            required: true,
            ondata: function(update) {
                this.nodeInstance.update = Handlebars.compile(update);
            }
        },
        "default": {
            description: "Graph URI for the Default Graph",
            datatype: 'string',
            ondata: function(defaultURI) {
                this.nodeInstance.defaultURIs = this.nodeInstance.defaultURIs || [];
                this.nodeInstance.defaultURIs.push(defaultURI);
            }
        },
        namespace: {
            description: "Graph URI for a Named Graph",
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
    var update = self.update(self.parameters);
    var graphURI = graph.graphURI;
    var defaultURIs = _.compact([graphURI].concat(self.defaultURIs));
    var args = (self.defaultURIs || self.namespaceURIs || graphURI) ?
        [update, defaultURIs, self.namespaceURIs || []] : [update];
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
