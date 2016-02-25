/**
 * File:  shex-chcs-to-rdf.js
 */

var _ = require('underscore');

var rs = require("rdfstore");
var Promise = require("bluebird");
var jsonld = require("jsonld");
var shexiface = require("../lib/shex/shexiface");

var jswrapper = require('../src/javascript-wrapper');
exports.getComponent = jswrapper({

    name: "shex-chcs-to-rdf",
    description: "converts CHCS patient data to RDF",

    inPorts: { 
        chcs_path: { 
            datatype: 'string',
            description: "a CHCS patient data file",
            required: true
        }
    },

    updater: function( chcs_path ) {  

console.log('updater');
        var chcs = require(chcs_path);
	chcs["@context"] = graphContext["@context"];
        duplicateScalars(chcs, ["id", "_id"], "identifier");

        var IN_GRAPH = "http://the.in.graph/";
        var OUT_GRAPH = "http://the.out.graph/";

        // Promise to build the rdf store
        return new Promise (function (resolve, reject) {
            rs.create({}, function (errors, store) {
                if (errors) reject(errors);
                resolve(store);
            });
        }).then(function (store) {

            // Promise to load the patient CHCS JSON-LD data into the store
            return new Promise(function (resolve, reject) {
                store.load("application/ld+json", chcs, IN_GRAPH, function(err,results) {
                    resolve(store);
                });
            });
        }).then(function (store) {

           // Promise to store the patient input graph
           return Promise.all([
               store, // graph,
               new Promise(function (resolve, reject) {
               store.graph(IN_GRAPH, function (errors, graph) {
                 if (errors) {
                     console.log('failed to store IN_GRAPH');
                     reject(errors);
                 }
                 resolve(graph);
               })}),

            // Promise to store the patient output graph
             new Promise(function (resolve, reject) {
               store.graph(OUT_GRAPH, function (errors, graph) {
                 if (errors) {
                     console.log('failed to store OUT_GRAPH');
                     reject(errors);
                 }
                 resolve(graph);
               })})

           ]).spread(function (store, inGraph, outGraph) {
             
             // Apply ShEx 
             return shexiface.ShExMapPerson(store, inGraph, outGraph).then(function () {
               // console.log(outGraph.toNT());
               return "Bonjour!";  // outGraph.toNT();

             });
           });

        }).catch (function (e) {
           console.warn("catch:", e.stack || e);
        });

        // return;
    }
});

// Duplicate ids and _ids.
var duplicateScalars = function(object, copyMez, newKey) {
    "use strict";
    for (var key in object) {
        if (key === "@context") {
              ; // leave it alone
        } else if (typeof object[key] === "object") {
            duplicateScalars(object[key], copyMez, newKey);
        } else if (copyMez.indexOf(key) !== -1) {
            object[newKey] = object[key];
        }
    }
    return object;
}

var graphContext = {
    "@context": {
        "loinc": "http://hokukahu.com/schema/loinc#",
        "hptc": "http://hokukahu.com/schema/hptc#",
        "cpt": "http://hokukahu.com/schema/cpt#",
        "ndc": "http://hokukahu.com/schema/ndc#",
        "icd9cm": "http://hokukahu.com/schema/icd9cm#",
        "npi": "http://hokukahu.com/schema/npi#",
        "nddf": "http://hokukahu.com/schema/nddf#",
        "@vocab": "http://hokukahu.com/schema/chcss#",
        "chcss": "http://hokukahu.com/schema/chcss#",
        "xsd": "http://www.w3.org/2001/XMLSchema#",
        "@base": "http://hokukahu.com/systems/chcs-1/",
        "_id": "@id",
        "id": "@id",
        "type": "@type",
        "list": "@list",
        "value": "@value",
        "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
        "label": {
            "@id": "rdfs:label"
        },
        "owl": "http://www.w3.org/2002/07/owl#",
        "fms": "http://datasets.caregraf.org/fms/",
        "sameAs": {
            "@id": "owl:sameAs",
            "@type": "@id"
        },
        "sameAsLabel": {
            "@id": "fms:sameAsLabel"
        }
   }
};
