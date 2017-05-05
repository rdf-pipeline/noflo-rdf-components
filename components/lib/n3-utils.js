/**
 * n3-utils.js
 *
 * A library of N3 helper APIs for use in the noflo RDF pipeline component updaters.
 */

var _ = require("underscore");

var N3 = require("n3");
var N3Util = N3.Util;

var fs = require("fs");
var util = require("util");

var jsonld = require("jsonld").promises;
var ttl2Jsonld = require("translators/lib/ttl-jsonld");

var errUtils = require("./error-utils");
var logger = require("../../src/logger");

module.exports = {
    jsonldToN3: jsonldToN3,
    n3ToJsonld: n3ToJsonld,
    n3ToTtl: n3ToTtl,
    n3ToTtlToJsonld: n3ToTtlToJsonld
}

/**
 * Create a new N3 store and load the JSON-LD data into it.  This is an
 * asynchronous method.  
 * 
 * @param (required) jsonld_data JSON-LD data to be loaded to the N3 store
 * 
 * @return the populated N3 store
 */
function jsonldToN3(jsonld_data) {
    return jsonld.toRDF(jsonld_data, {}).then(

        function(dataset) {
            var inGraph = N3.Store();

            _.each(dataset, 
                function(triples, graphName) {
                    _.each(triples, function(triple) {

                        inGraph.addTriple({
                            subject: toN3(triple.subject),
                            predicate: toN3(triple.predicate),
                            object: toN3(triple.object),
                            graph: graphName == '@default' ? undefined : graphName
                        });

                    });
            });

            return inGraph;

    }).catch(function(e) {
        logger.error("Exception converting JSON-LD to N3:", util.inspect(e, {depth:null}));
        throw Error("Unable to convert JSON-LD to N3: " + e.message);
    });
}

/** 
 * Converts an RDF element to the appropriate N3 value or literal
 *  
 * @param (required) term the triple element to process
 *
 * @return the correct N3 literal or value 
 */
function toN3(term) {
    if (term.type != 'literal') {
        return term.value;
    }

    return N3.Util.createLiteral(term.value, 
                                 term.language || term.datatype);
}

/**
 * Converts an n3 graph to ttl and writes it to a file if one is specified
 * 
 * @param store    (required) the N3 store to convert to text/Turtle format
 * @param filename (optional) an optional file name to write the Turtle result into.
 *
 * @return a promise to return either the TTL format or a reject on error
 */
function n3ToTtl(store, filename) {
    if (_.isEmpty(store)) { 
        return Promise.reject(errUtils.errorMessage("n3ToTtl called with an empty N3 store!"));
    }

    return new Promise(
        function(resolve, reject) { 
            var writer = N3.Writer(); 

            store.find().forEach(t => { 
                writer.addTriple(t); 
            });

            writer.end(function(error, result) {

                if (!_.isNull(error)) { 
                    return reject(errUtils.errorMessage("Unable to convert N3 store to TTL!", error));  
                }  
    
                if (_.isEmpty(filename)) { 
                    return resolve(result);
                }

                return fs.writeFile(filename, result, function(error) { 
                    if (!_.isNull(error)) { 
                        return reject(errUtils.errorMessage("n3ToTtl API was unable to write file" + filename + "!", error));
                    } 

                    return resolve(result);
                });

            });

        }).catch(function(e) { 
            return Promise.reject(errUtils.errorMessage('Unable to convert N3 store to TTL!',e));
        });
}

/**
 * Converts an N3 store into TTL, loads the TTL, and converts the TTL to JSON-LD.  This function
 * is intended primarily for testing/double checking the n3ToJsonld method and will likely be 
 * deleted or deprecated in the future. 
 *
 * @param store    (required) the N3 store to convert to text/Turtle format
 * @param frame    (optional) a JSON-LD frame
 * @param filename (optional) an optional file name to write the Turtle result into.
 *
 * @return a promise to return either the JSON-LD format or a reject on error
 */ 
function n3ToTtlToJsonld(store, frame, filename) { 
    return new Promise(function(resolve, reject) { 

        n3ToTtl(store).then(

            function(ttl) { 
                if (_.isEmpty(ttl)) { 
                    return reject(errUtils.errorMessage("n3ToTtlToJsonld API received no content to convert to JSON-LD!"));
                } 

                ttl2Jsonld.ttlLoad(ttl).then(
                    function(n3Store) { 

                        var filterBnodeAttrs = [ 'id', '_id', '@id' ];
                        ttl2Jsonld.rdfToJsonLd(n3Store, frame, filterBnodeAttrs).then(
                            function(json) { 

                                if (_.isEmpty(filename)) { 
                                    return resolve(json);
                                }

                                fs.writeFile(filename, JSON.stringify(json, null, 2), 
                                    function(error) { 
                                        if (!_.isNull(error)) { 
                                            return reject(errUtils.errorMessage("n3ToTtlToJsonld API was unable to write file " + filename + "!\n", error));
                                        } 

                                        return resolve(json);
                                });
                            });
                         }, 

                         function(fail) { 
                             return reject(errUtils.errorMessage('Failed to load ttl!', fail));

                     }).catch(function(e) { 
                         return reject(errUtils.errorMessage('Exception loading ttl!', e));
                     });
            }, 

            function(fail) { 
                reject(errUtils.errorMessage("n3ToTtlToJsonld error converting N3 store to TTL!", fail));
    
        }).catch(function(e) { 
            return Promise.reject(errUtils.errorMessage('Exception in n3ToTtlToJsonld!', e));
        });
    });
}

/**
 * Converts an N3 store into JSON-LD. It is an asychronous function.
 * 
 * @param store    (required) the N3 store to convert to JSON-LD format
 * @param frame    (required) a JSON-LD frame
 * @param filename (optional) an optional file name to write the Turtle result into.
 *
 * @return a promise to return either the JSON-LD format or a reject on error
 */ 
function n3ToJsonld(n3Store, frame, filename) {
    if (_.isEmpty(n3Store)) { 
        return Promise.reject(errUtils.errorMessage("n3ToJsonld API requires an N3 store!"));
    }

    if (_.isEmpty(frame)) { 
        return Promise.reject(errUtils.errorMessage("n3ToJsonld API requires a frame!"));
    }

    var triples = n3Store.find();
    if (_.isEmpty(triples)) { 
        return Promise.resolve('');
    }
       
    return new Promise(function(resolve, reject) { 
        resolve(
             jsonld.fromRDF( 
                triples.reduce(
                    function(dataset, triple) {
                        var graph = triple.graph || '@default';
                        dataset[graph] = dataset[graph] || [];
                        dataset[graph].push({
                            subject: fromN3(triple.subject),
                            predicate: fromN3(triple.predicate),
                            object: fromN3(triple.object)
                        });
                        return dataset;
                    }, {'@default': []}), {})   
         ); 

    }).then(
        function(json) {
            return new Promise(function(resolve, reject) { 

                return jsonld.frame(json, frame, {embed: '@always'}, function(err, framed) {
                    if (!_.isEmpty(err)) { 
                        return reject(errUtils.errorMessage("n3ToJsonld API was unable to frame JSON!", err));
                    }

                    var roots = _.uniq(
                        n3Store.find(null, 
                                     "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", 
                                     null)
                        .map(triple => triple.subject)
                        .filter(subject => 
                             subject.startsWith("_:") && _.isEmpty(n3Store.find(null, null, subject))) 
                    ); 
                    // Filter the framed JSON-LD to retain only the real root graph elements
                    var graphs = _.filter(framed['@graph'], 
                        function(graph) { 
                            // got a real ID - keep it
                            if (!_.isUndefined(graph['id']) && !graph['id'].startsWith("_:")) return true;
                            return !_.isUndefined(_.find(roots, function(root) {
                                // keep only graphs with a root id or an id that is not a blank node
                                return (!graph['id'].startsWith("_:") ||  
                                        root === graph['id'] ||  root === graph['@id'] || root === graph['_id']);  
                            }));
                    });
                     
                    // Filter out ids with blank nodes that point to nothing else
                    var filterBnodeAttrs = [ 'id', '_id', '@id' ];
                    framed['@graph'] = _.map(graphs, function(graph) { 
                        return ttl2Jsonld.filterBNodes(graph, filterBnodeAttrs); 
                    });

                    if (_.isEmpty(filename)) { 
                        return resolve(framed);
                    }

                    fs.writeFile(filename, JSON.stringify(framed, null, 2), 
                        function(error) { 
                            if (!_.isNull(error)) { 
                                return reject(errUtils.errorMessage("n3ToJsonld API was unable to write file " +
                                                                    filename + "!\n", error));
                            } 
                            return resolve(framed);
                    });
               });

        });
    });
}

/** 
 * Convert N3 values to the appropriate JSON-LD details 
 * 
 * @param value (required) value to be converted
 * 
 * @return JSON-LD representation for the value
 */
function fromN3(value) {
    if (value.indexOf('"') === 0) {

        if ("http://www.w3.org/2001/XMLSchema#boolean" === N3.Util.getLiteralType(value)) { 
            return { type: 'literal',
                     value: (N3.Util.getLiteralValue(value) == 'true') };
        }

        return {
            type: 'literal',
            value: N3.Util.getLiteralValue(value),
            language: N3.Util.getLiteralLanguage(value) || undefined,
            datatype: N3.Util.getLiteralType(value) || undefined
        };

    } else if (value.indexOf('_:') === 0) {
        return {
            type: 'blank node',
            value: value
        };
    } 

    return {
        type: 'IRI',
        value: value
    };
}

