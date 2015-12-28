// rdf-update.js

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
                description: "RDF JS Interface Graph object",
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
            update: {
                description: "SPARQL update template string in handlebars syntax",
                datatype: 'string',
                required: true,
                process: basenode.on({data: assign('update', Handlebars.compile)})
            },
            "default": {
                description: "Graph URI for the default dataset",
                datatype: 'string',
                process: basenode.on({data: assign('defaultURIs', basenode.push)})
            },
            namespace: {
                description: "Graph URI for the named dataset",
                datatype: 'string',
                process: basenode.on({data: assign('namespaceURIs', basenode.push)})
            },
            'in': {
                description: "RDF JS Interface Graph object",
                datatype: 'object',
                required: true,
                process: basenode.on({data: execute})
            }
        }
    }), {
        description: "Executes the given SPARQL update on the provided RDF graph and returns it",
        icon: 'cogs'
    });
};

function assign(name, transform){
    return function(data){
        this[name] = _.isFunction(transform) ? transform(data, this[name]) : data;
    };
}

function execute(graph) {
    var outPorts = this.outPorts;
    var update = this.update(this.parameters);
    var graphURI = graph.graphURI;
    var defaultURIs = _.compact([graphURI].concat(this.defaultURIs));
    var args = (this.defaultURIs || this.namespaceURIs || graphURI) ?
        [update, defaultURIs, this.namespaceURIs || []] : [update];
    asRdfStore(graph).then(function(store){
        return Promise.denodeify(store.execute).apply(store, args).then(function(){
            if (graphURI) {
                return denodeify(store, 'graph', graphURI);
            } else {
                return denodeify(store, 'graph');
            }
        }).then(function(graph){
            graph.rdfstore = store;
            graph.graphURI = graphURI;
            outPorts.out.send(graph);
            outPorts.out.disconnect();
        });
    }).catch(function(err){
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
