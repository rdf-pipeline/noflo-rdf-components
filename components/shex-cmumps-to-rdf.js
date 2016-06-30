// shex-cmumps-to-rdf.js
// This component converts patient medical CMUMPS lab records to FHIR RDF

var _ = require('underscore');

var N3 = require("n3");
var jsonld = require("jsonld");

var fs = require('fs');
var util = require('util');

var logger = require('../src/logger');
var shexiface = require("../shex/shexiface");
var wrapper = require('../src/shex-wrapper');

module.exports = wrapper({
    preprocess: preprocess
});

function preprocess(data) {

   logger.debug('Enter', {nodeInstance: this.nodeInstance});
       // console.log('data: ',util.inspect(data, {depth:null})+'\n');logger.debug

   if (_.isEmpty(data)) {
        throw Error("shex-cmumps-to-rdf component requires cmumps data to parse!");
    }
  
    var parsedData;
    try {
       var parsedData = (_.isString(data)) ? JSON.parse(data) : data;
    } catch (e) {
        throw new Error("shex-cmumps-to-rdf component is unable to parse input data: "+e.message);
    }
    
    if (_.isUndefined(parsedData['@context']) || _.isUndefined(parsedData['@graph'])) {
        throw new Error("shex-cmumps-to-rdf component expects @context and @graph specification on input data!");
    }

    parsedData["@context"] = graphContext["@context"];
    parsedData["@graph"] = parsedData["@graph"].filter(function (ob) {
        // Filter to known types for cleaned.jsonld, 2.1 w, 4.2 w/o
        return ob.type.substr('cmumpss:'.length) in shexiface.type2shape;
    });  

    // normalize the identifer attribute - deep map any id or _id attribute to 
    // an "identifier" attribute for ShEx processing.
    normalizeAttribute(parsedData, 
                       ["id", "_id"],
                        "identifier");

    return parsedData;
}

/**
 * Deep map the source attributes to a new target attribute in the object
 *
 * @object object to be modified
 * @sourceKeys object keys to be mapped to the target key
 * @targetKey target key name to be inserted 
 *
 * @return the modified object
 */
function normalizeAttribute(object, sourceKeys, targetKey) {

    for (var key in object) {
        if (key === "@context") {
              ; // leave it alone
        } else if (typeof object[key] === "object") {
            normalizeAttribute(object[key], sourceKeys, targetKey);
        } else if (sourceKeys.indexOf(key) !== -1) {
            object[targetKey] = object[key];
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
        "@vocab": "http://hokukahu.com/schema/cmumpss#",
        "cmumpss": "http://hokukahu.com/schema/cmumpss#",
        "xsd": "http://www.w3.org/2001/XMLSchema#",
        "@base": "http://hokukahu.com/systems/cmumps-1/",
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
