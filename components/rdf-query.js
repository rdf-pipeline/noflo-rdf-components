// rdf-query.js

var _ = require('underscore');
var Promise = require('promise');
var Handlebars = require('handlebars');
var rdfstore = require('rdfstore');
var noflo = require('noflo');

exports.getComponent = function() {
    return _.extend(new noflo.Component({
        outPorts: {
            out: {
                description: "Query result",
                datatype: 'object'
            },
            error: {
                description: "Error object",
                datatype: 'object'
            }
        },
        inPorts: {
            parameters: {
                description: "A map of template parameters",
                datatype: 'object',
                process: on({data: assign('parameters')})
            },
            query: {
                description: "SPARQL query template string in handlebars syntax",
                datatype: 'string',
                required: true,
                process: on({data: assign('query', Handlebars.compile)})
            },
            "default": {
                description: "Graph URI for the default dataset",
                datatype: 'string',
                process: on({data: assign('defaultURIs', push)})
            },
            namespaces: {
                description: "Graph URI for the named dataset",
                datatype: 'string',
                process: on({data: assign('namespacesURIs', push)})
            },
            'in': {
                description: "RDF JS Interface Graph object",
                datatype: 'object',
                required: true,
                process: on({data: execute})
            }
        }
    }), {
        description: "Executes the given SPARQL query on the provided RDF graph and returns the result",
        icon: 'cog'
    });
};

function on(type, callback) {
    return function(event, payload) {
        if (type[event]) type[event].call(this.nodeInstance, payload);
    };
}

function assign(name, transform){
    return function(data){
        this[name] = _.isFunction(transform) ? transform(data, this[name]) : data;
    };
}

function push(item, array) {
    var ar = array || [];
    ar.push(item);
    return ar;
}

function execute(graph) {
    var outPorts = this.outPorts;
    var query = this.query(this.parameters);
    var store = graph.rdfstore;
    var graphURI = graph.graphURI;
    var defaultURIs = _.compact([graphURI].concat(this.defaultURIs));
    // TODO handle missing store/graphURI
    var args = (this.defaultURIs || this.namespaceURIs) ?
        [query, this.defaultURIs || [], this.namespaceURIs || []] : [query];
    Promise.denodeify(store.execute).apply(store, args).then(function(result){
        outPorts.out.send(result);
        outPorts.out.disconnect();
    }).catch(function(err){
        outPorts.error.send(err);
        outPorts.error.disconnect();
    });
}
