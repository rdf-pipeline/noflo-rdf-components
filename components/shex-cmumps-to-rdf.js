// shex-cmumps-to-rdf.js
// This component converts patient medical CMUMPS lab records to FHIR RDF
// Pre and post processing is done here, however, the bulk of the shex processing is done by the shex-wrapper, which calls the shexiface module

var _ = require('underscore');

var N3 = require("n3");
var jsonld = require("jsonld");

var fs = require('fs');
var util = require('util');

var logger = require('../src/logger');
var wrapper = require('../src/shex-wrapper');
var fhir = require("../shex/targets/fhir");
var CMUMPS_NS = "http://hokukahu.com/schema/cmumpss#";

var myTypeToShape = { // CMUMPS_path is just documentation.
  "Order-101":    { from: null, to: null, targetType: null, CMUMPS_path: "orders" },
  "101_03":       { from: null, to: null, targetType: null, CMUMPS_path: "orders/qa_event_date-101" },
  "101_05":       { from: null, to: null, targetType: null, CMUMPS_path: "orders/status_change-101" },
  "101_11":       { from: null, to: null, targetType: null, CMUMPS_path: "orders/order_required_data-101" },
  "Result-63_07": { from: "CMUMPS_result.shex", to: "FHIR_DiagnosticReport.shex", targetType: "DiagnosticReport", CMUMPS_path: "labs/clinical_chemistry-63/result-63_04" },
  // "11_07":     { from: null, to: null, targetType: null, CMUMPS_path: "labs/clinical_chemistry-63/result-63_04" },
  "2":            { from: null, to: null, targetType: null, CMUMPS_path: "demographics" },
  "2_03":         { from: null, to: null, targetType: null, CMUMPS_path: "demographics/medical_record_type-2" },
  "2_4":          { from: null, to: null, targetType: null, CMUMPS_path: "demographics/user_altering_patient_record-2" },
  "Patient_Appointment-44_2": { from: null, to: null, targetType: null, CMUMPS_path: "appointments" },
  "52":           { from: null, to: null, targetType: null, CMUMPS_path: "medsop" },
  "52_00":        { from: null, to: null, targetType: null, CMUMPS_path: "medsop/activity_log-52" },
  "52_01":        { from: null, to: null, targetType: null, CMUMPS_path: "medsop/fill_dates-52" },
  "55":           { from: null, to: null, targetType: null, CMUMPS_path: "medsinp" },
  //"63":         { from: "patient_labs_cmumps.shex", to: "patient_labs_fhir.shex", targetType: null, CMUMPS_path: "labs" },
  "Lab_Result-63": { from: null, to: null, targetType: null, CMUMPS_path: "labs" },
  "Clinical_Chemistry-63_04": { from: "CMUMPS_clinical_chemistry.shex", to: "FHIR_DiagnosticOrder.shex", targetType: "DiagnosticOrder", CMUMPS_path: "labs/clinical_chemistry-63" },
  // "63_04":     { from: null, to: null, targetType: null, CMUMPS_path: "labs/clinical_chemistry-63" },
  "63_832":       { from: null, to: null, targetType: null, CMUMPS_path: "labs/performing_lab_disclosures-63_04" },
  "8810":         { from: null, to: null, targetType: null, CMUMPS_path: "allergies" },
  "Medication_Profile-8810_3": { from: null, to: null, targetType: null, CMUMPS_path: "allergies/drug_allergy-8810" },
  "Patient-2":    { from: null, to: null, targetType: null, CMUMPS_path: "patient" },
}

module.exports = wrapper({
    fromFormat: "cmumpss",
    toFormat: "fhir",
    myBase: CMUMPS_NS,
    staticBindings: fhir.staticBindings,
    makeTargetNode: makeTargetNode,
    targetFixup: fhir.targetFixup,
    myTypeToShape: myTypeToShape,
    inPorts: ['input', 'source_graph', 'target_graph', 'meta_graph', 'cmumpss_prefix'],
    preprocess: preprocess,
    postprocess: postprocess
});

function makeTargetNode (fromGraph, key, s) {
    var cmumpsIDPredicate = "http://hokukahu.com/schema/cmumpss#identifier";
	var namespace = "urn:local:fhir:" + myTypeToShape[key].targetType + ":";
	var object = fromGraph.find(s, cmumpsIDPredicate, null)[0].object;
	var value = /^"([^]*)"/.exec(object)[1];
	return namespace + value;
}

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


    var cmumpss_prefix = this.inputStates('cmumpss_prefix') || {data: 'cmumpss'};
    graphContext["@context"][cmumpss_prefix.data] = CMUMPS_NS;
    parsedData["@context"] = graphContext["@context"];
    parsedData["@graph"] = parsedData["@graph"].filter(function (ob) {
        // Filter to known types for cleaned.jsonld, 2.1 w, 4.2 w/o
        return ob.type.substr(1 + cmumpss_prefix.data.length) in myTypeToShape;
    });  

    // normalize the identifer attribute - deep map any id or _id attribute to 
    // an "identifier" attribute for ShEx processing.
    normalizeAttribute(parsedData, 
                       ["id", "_id"],
                        "identifier");

    return parsedData;
}

function postprocess(jsonld) {
    var target_graph = this.inputStates('target_graph');
    if (!target_graph) return jsonld;
    var meta_graph = this.inputStates('meta_graph');
    var source_graph = this.inputStates('source_graph');
    var typeAndPatient = target_graph.data.match(/.*:([^:]*):([^:]*)$/);
    if (meta_graph) return [
        {
            '@context': graphContext,
            '@id': target_graph.data,
            '@graph': jsonld
        },
        {
            '@context': graphContext,
            '@id': meta_graph.data,
            '@graph': [
                {
                    '@id': target_graph.data,
                    '@type': 'meta:Graph',
                    'meta:patientId': typeAndPatient[2],
                    'meta:fhirResourceType': 'fhir:' + typeAndPatient[1],
                    'prov:wasDerivedFrom': source_graph && source_graph.data,
                    'prov:generatedAtTime': {
                        '@value': new Date().toISOString(),
                        '@type': 'xsd:dateTime'
                    },
                    'meta:translatedBy': this.nodeInstance.componentName
                }
            ]
        }
    ]; else return {
        '@context': graphContext,
        '@id': target_graph.data,
        '@graph': jsonld
    };
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
        "meta": "urn:meta#",
        "loinc": "http://hokukahu.com/schema/loinc#",
        "hptc": "http://hokukahu.com/schema/hptc#",
        "cpt": "http://hokukahu.com/schema/cpt#",
        "ndc": "http://hokukahu.com/schema/ndc#",
        "icd9cm": "http://hokukahu.com/schema/icd9cm#",
        "npi": "http://hokukahu.com/schema/npi#",
        "nddf": "http://hokukahu.com/schema/nddf#",
        "@vocab": CMUMPS_NS,
        "cmumpss": CMUMPS_NS,
        "prov": "http://www.w3.org/ns/prov#",
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
