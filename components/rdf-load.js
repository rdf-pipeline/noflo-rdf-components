// rdf-load.js

var _ = require('underscore');
var Promise = require('promise');
var rdfstore = require('rdfstore');
var noflo = require('noflo');

var basenode = require('./base-node');

exports.getComponent = function() {
    return _.extend(new noflo.Component({
        outPorts: {
            out: {
                description: "All the quads as a RDF JS Interface Graph object",
                datatype: 'object'
            },
            error: {
                description: "Error object",
                datatype: 'object'
            }
        },
        inPorts: {
            options: {
                description: "A map of configuration options for the store",
                datatype: 'object',
                process: basenode.on({data: assign('options')})
            },
            media: {
                description: "Media type (application/json, text/n3...) of the data to be parsed or the value 'remote' if a URI for the data is passed instead",
                datatype: 'string',
                process: basenode.on({data: assign('media')})
            },
            graph: {
                description: "Graph URI template where the parsed triples will be inserted. If it is not specified, triples will be loaded in the default graph",
                datatype: 'string',
                process: basenode.on({data: assign('graph')})
            },
            'in': {
                description: "RDF data to be parsed and loaded or an URI where the data will be retrieved after performing content negotiation",
                datatype: 'all',
                required: true,
                process: basenode.on({
                    data: assign('data'),
                    disconnect: load
                })
            }
        }
    }), {
        description: "Loads data into a RDF JS Interface Graph object",
        icon: 'sign-in'
    });
};

function assign(name, transform){
    return function(data){
        this[name] = _.isFunction(transform) ? transform(data, this[name]) : data;
    };
}

function load() {
    var outPorts = this.outPorts;
    var graphURI = this.graph ? this.graph :
        _.isString(data) && !data.match(/[^\w%-._~:\/?#\[\]@!$&'()*+,;=]/) ?
        data : undefined;
    var data = this.data;
    var media = this.media ? this.media :
        _.isString(data) ? 'remote' :
        _.isObject(data) ? 'application/json' : undefined;
    if (this.data) this.data = null;
    denodeify(rdfstore, 'create', this.options || {}).then(function(store){
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
            outPorts.out.send(graph);
            outPorts.out.disconnect();
        });
    }).catch(function(err){
        outPorts.error.send(err);
        outPorts.error.disconnect();
    });
}

function denodeify(object, functionName /* arguments */) {
    var args = _.toArray(arguments).slice(2);
    return Promise.denodeify(object[functionName]).apply(object, args);
}
