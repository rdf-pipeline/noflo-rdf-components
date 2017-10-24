"use strict";

var fs = require("fs");
var util=require("util");

var N3 = require("n3");
var N3Util = N3.Util;
var ShEx = require("shex");
var ShExParser = ShEx.Parser;
var ShExLoader = ShEx.Loader;
var ShExValidator = ShEx.Validator;
var Mapper = ShEx.Mapper;
var ShExDir = __dirname+"/";
var start = Date.now();

var RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

// constants
var PROV_DERIVED = "http://www.w3.org/ns/prov#wasDerivedFrom";

var NextNode = 0;

module.exports = ShExMapGraph;

// Load each schema on demand.
function schemaPromise (typeToShape, key, fromto) {

    var saveAs = fromto + "Ob";
    if (!(saveAs in typeToShape[key])) {

        typeToShape[key][saveAs] = new Promise(function (resolve, reject) { 

            var txt = fs.readFile(ShExDir + typeToShape[key][fromto], "utf-8", function (err, res) {
	        if (err) {
                    return reject(err);
                }

	        try {
                    // now("loaded typeToShape[" + key + "][" + saveAs + "]");
                    var parser = ShExParser.construct();
                    return resolve(parser.parse(res));
	        } catch (e) {
	            reject(e);
	        }
            });
        });
    }

    return typeToShape[key][saveAs];
}

function ShExMapGraph (fromGraph, typeToShape, base, staticBindings, makeTargetNode, targetFixup) {
    var toGraph = N3.Store();
    var typeArcs = fromGraph.find(null, RDF_TYPE, null);
    // now("got " + typeArcs.length + " type arcs");

    return Promise.all(typeArcs.reduce(function (ret, typeArc) {

        var key = typeArc.object.substr(base.length);

        if (key in typeToShape && typeToShape[key].from && typeToShape[key].to) {
            return ret.concat(Promise.all([
	        schemaPromise(typeToShape, key, "from"),
	        schemaPromise(typeToShape, key, "to")
            ]).then(function (schemas) {

	        var toNode = makeTargetNode(key, typeArc.subject);

	        if (mapLoadedShapes (schemas[0], schemas[1], 
                                     fromGraph, toGraph, 
                                     typeArc.subject, toNode, 
                                     staticBindings)) {
	            NextNode++;
	            toGraph.addTriple({subject: toNode, 
                                       predicate: PROV_DERIVED, 
                                       object: typeArc.subject});
	            return { passed: typeArc.subject };
	        } else {
	            // console.warn(key, typeArc.subject);
	            return { failed: typeArc.subject };
	        }
            }));
        } else {
            var ent = typeToShape[key];
            // console.warn("ignoring " + key, 
            //               key in typeToShape, ent ? typeToShape[key].from !== null : null, ent ? typeToShape[key].to !== null : null);
        }

        return ret;
    }, [])).then(function (log) {

        try {
            targetFixup(toGraph);
        } catch (e) {
            console.warn(e.stack);
        }

        // now("Shexiface processed", log.length, " Diagnostic records.");
        return {data:toGraph, log:log};
    });
}

var blankNodeCount = 0;
function nextBNode () {
    return "_:b" + blankNodeCount++;
}

function mapLoadedShapes(fromSchema, toSchema, fromGraph, toGraph, fromNode, toNode, staticBindings) {
    // prepare validator
    var validator = ShExValidator.construct(fromSchema);
    Mapper.register(validator);

    // run validator
    var val = validator.validate(fromGraph, fromNode, null);
    if ("errors" in val) {
        console.error("Validation failed: ",val);
        return false;
    }

    var resultBindings = validator.semActHandler.results["http://shex.io/extensions/Map/#"];
    Object.keys(staticBindings).forEach(function (k) {
        resultBindings[k] = staticBindings[k];
    });

    // now("resultBindings:", resultBindings);
    var map = Mapper.materializer(toSchema, nextBNode);
    try {
         map.materialize(resultBindings, toNode, undefined, toGraph);
    } catch(e) { 
        console.error(e.stack);
        throw e;
    }

    return true;
}

function now() {
    var args = Array.prototype.slice.call(arguments);
    var at = Date.now();
    args.unshift((at - start)/1000);
    start = at; // if you want delta vs cumulative time
    return console.warn.apply(console, args);
}

function dumpTriples (triples) {
    var base = 'http://hokukahu.com/systems/chcs-1/';
    var writer = N3.Writer({
	prefixes: {
	    '': 'http://hokukahu.com/schema/chcss#',
	    xsd: 'http://www.w3.org/2001/XMLSchema#',
	    rdfs: 'http://www.w3.org/2000/01/rdf-schema#'
	}
    });
    triples.forEach(t => {
	['subject', 'predicate', 'object'].forEach(term => {
	    if (t[term].startsWith(base))
		t[term] = t[term].substr(base.length);
	});
	writer.addTriple(t);
    })
    writer.end(function (error, result) {
	if (error) throw (error)
	else console.warn("@base <" + base + ">.\n" + result);
    });
}

