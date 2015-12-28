// rdf-query.js

var _ = require('underscore');
var Promise = require('promise');
var Handlebars = require('handlebars');
var rdfstore = require('rdfstore');
var noflo = require('noflo');

var basenode = require('./base-node');

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
                process: basenode.on({data: assign('parameters')})
            },
            query: {
                description: "SPARQL query template string in handlebars syntax",
                datatype: 'string',
                required: true,
                process: basenode.on({data: assign('query', Handlebars.compile)})
            },
            "default": {
                description: "Graph URI for the default dataset",
                datatype: 'string',
                process: basenode.on({data: assign('defaultURIs', basenode.push)})
            },
            namespaces: {
                description: "Graph URI for the named dataset",
                datatype: 'string',
                process: basenode.on({data: assign('namespacesURIs', basenode.push)})
            },
            'in': {
                description: "RDF JS Interface Graph object",
                datatype: 'object',
                required: true,
                process: basenode.on({data: execute})
            }
        }
    }), {
        description: "Executes the given SPARQL query on the provided RDF graph and returns the result",
        icon: 'cog'
    });
};


function assign(name, transform){
    return function(data){
        this[name] = _.isFunction(transform) ? transform(data, this[name]) : data;
    };
}

function execute(graph) {
    var outPorts = this.outPorts;
    var query = this.query(this.parameters);
    var graphURI = graph.graphURI;
    var defaultURIs = _.compact([graphURI].concat(this.defaultURIs));
    var args = (this.defaultURIs || this.namespaceURIs || graphURI) ?
        [query, defaultURIs, this.namespaceURIs || []] : [query];
    asRdfStore(graph).then(function(store){
        return Promise.denodeify(store.execute).apply(store, args);
    }).then(function(result){
        outPorts.out.send(result);
        outPorts.out.disconnect();
    }, function(err){
        outPorts.error.send(err);
        outPorts.error.disconnect();
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
