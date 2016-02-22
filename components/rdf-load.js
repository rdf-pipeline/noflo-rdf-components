// rdf-load.js

var _ = require('underscore');
var Promise = require('promise');
var rdfstore = require('rdfstore');

var promiseOutput = require('../src/promise-output');
var componentFactory = require('../src/noflo-component-factory');

/**
 * Loads data into a RDF JS Interface Graph object
 */
exports.getComponent = componentFactory({
    description: "Loads data into a RDF JS Interface Graph object",
    icon: 'sign-in',
    outPorts: promiseOutput.outPorts,
    inPorts: {
        options: {
            description: "A map of configuration options for the store",
            datatype: 'object',
            ondata: function(options) {
                this.nodeInstance.rdfOptions = options;
            }
        },
        media: {
            description: "Media type (application/json, text/n3...) of the data to be parsed or the value 'remote' if a URI for the data is passed instead",
            datatype: 'string',
            ondata: function(media) {
                this.nodeInstance.media = media;
            }
        },
        graph: {
            description: "Graph URI template where the parsed triples will be inserted. If it is not specified, triples will be loaded in the default graph",
            datatype: 'string',
            ondata: function(graph) {
                this.nodeInstance.rdfGraph = graph;
            }
        },
        input: {
            description: "RDF data to be parsed and loaded or an URI where the data will be retrieved after performing content negotiation",
            datatype: 'all',
            required: true,
            ondata: function(data) {
                this.nodeInstance.data = data;
            },
            ondisconnect: promiseOutput(load)
        }
    }
});

/**
 * Loads data into a RDF JS Interface Graph object
 * @this a InPort or facade with options on the nodeInstance property object
 */
function load() {
    var self = this.nodeInstance;
    var graphURI = self.rdfGraph ? self.rdfGraph :
        _.isString(data) && !data.match(/[^\w%-._~:\/?#\[\]@!$&'()*+,;=]/) ?
        data : undefined;
    var data = self.data;
    var media = self.media ? self.media :
        _.isString(data) ? 'remote' :
        _.isObject(data) ? 'application/json' : undefined;
    if (self.data) self.data = null;
    return denodeify(rdfstore, 'create', self.rdfOptions || {}).then(function(store){
        return Promise.resolve().then(function(){
            if (media) {
                return denodeify(store, 'load', media, data, graphURI || {});
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
}

/**
 * Converts cb style async functions to promise style functions
 */
function denodeify(object, functionName /* arguments */) {
    var args = _.toArray(arguments).slice(2);
    return Promise.denodeify(object[functionName]).apply(object, args);
}
