// shex-chcs-to-rdf.js
// This component converts patient medical CHCS lab records to FHIR RDF
// Pre and post processing is done here, however, the bulk of the shex processing is done by the shex-wrapper, which calls the shexiface module

var _ = require('underscore');

var N3 = require("n3");
var jsonld = require("jsonld");

var fs = require('fs');
var util = require('util');

var logger = require('../src/logger');
var wrapper = require('../src/shex-wrapper');
var fhir = require("../shex/targets/fhir");
var CHCS_NS = "http://hokukahu.com/schema/chcss#";

var myTypeToShape = { // CHCS_path is just documentation.
  "Order-101":    { from: null, to: null, targetType: null, CHCS_path: "orders" },
  "101_03":       { from: null, to: null, targetType: null, CHCS_path: "orders/qa_event_date-101" },
  "101_05":       { from: null, to: null, targetType: null, CHCS_path: "orders/status_change-101" },
  "101_11":       { from: null, to: null, targetType: null, CHCS_path: "orders/order_required_data-101" },
  "Result-63_07": { from: "CHCS_result.shex", to: "FHIR_DiagnosticReport.shex", targetType: "DiagnosticReport", CHCS_path: "labs/clinical_chemistry-63/result-63_04" },
  // "11_07":     { from: null, to: null, targetType: null, CHCS_path: "labs/clinical_chemistry-63/result-63_04" },
  "2":            { from: null, to: null, targetType: null, CHCS_path: "demographics" },
  "2_03":         { from: null, to: null, targetType: null, CHCS_path: "demographics/medical_record_type-2" },
  "2_4":          { from: null, to: null, targetType: null, CHCS_path: "demographics/user_altering_patient_record-2" },
  "Patient_Appointment-44_2": { from: null, to: null, targetType: null, CHCS_path: "appointments" },
  "52":           { from: null, to: null, targetType: null, CHCS_path: "medsop" },
  "52_00":        { from: null, to: null, targetType: null, CHCS_path: "medsop/activity_log-52" },
  "52_01":        { from: null, to: null, targetType: null, CHCS_path: "medsop/fill_dates-52" },
  "55":           { from: null, to: null, targetType: null, CHCS_path: "medsinp" },
  //"63":         { from: "patient_labs_chcs.shex", to: "patient_labs_fhir.shex", targetType: null, CHCS_path: "labs" },
  "Lab_Result-63": { from: null, to: null, targetType: null, CHCS_path: "labs" },
  "Clinical_Chemistry-63_04": { from: "CHCS_clinical_chemistry.shex", to: "FHIR_DiagnosticOrder.shex", targetType: "DiagnosticOrder", CHCS_path: "labs/clinical_chemistry-63" },
  // "63_04":     { from: null, to: null, targetType: null, CHCS_path: "labs/clinical_chemistry-63" },
  "63_832":       { from: null, to: null, targetType: null, CHCS_path: "labs/performing_lab_disclosures-63_04" },
  "8810":         { from: null, to: null, targetType: null, CHCS_path: "allergies" },
  "Medication_Profile-8810_3": { from: null, to: null, targetType: null, CHCS_path: "allergies/drug_allergy-8810" },
  "Patient-2":    { from: null, to: null, targetType: null, CHCS_path: "patient" },
}

module.exports = wrapper({
    fromFormat: "chcss",
    toFormat: "fhir",
    myBase: CHCS_NS,
    staticBindings: fhir.staticBindings,
    makeTargetNode: makeTargetNode,
    targetFixup: fhir.targetFixup,
    myTypeToShape: myTypeToShape,
    vocab: "http://hl7.org/fhir/",
    inPorts: ['input', 'source_graph', 'target_graph', 'meta_graph', 'chcss_prefix'],
    preprocess: preprocess,
    postprocess: postprocess
});

function makeTargetNode (fromGraph, key, s) {
    var chcsIDPredicate = "http://hokukahu.com/schema/chcss#identifier";
	var namespace = "urn:local:fhir:" + myTypeToShape[key].targetType + ":";
	var object = fromGraph.find(s, chcsIDPredicate, null)[0].object;
	var value = /^"([^]*)"/.exec(object)[1];
	return namespace + value;
}

function preprocess(data) {

   logger.debug('Enter', {nodeInstance: this.nodeInstance});
       // console.log('data: ',util.inspect(data, {depth:null})+'\n');logger.debug

   if (_.isEmpty(data)) {
        throw Error("shex-chcs-to-rdf component requires chcs data to parse!");
    }
  
    var parsedData;
    try {
       var parsedData = (_.isString(data)) ? JSON.parse(data) : data;
    } catch (e) {
        throw new Error("shex-chcs-to-rdf component is unable to parse input data: "+e.message);
    }
    
    if (_.isUndefined(parsedData['@context']) || _.isUndefined(parsedData['@graph'])) {
        throw new Error("shex-chcs-to-rdf component expects @context and @graph specification on input data!");
    }


    var chcss_prefix = this.inputStates('chcss_prefix') || {data: 'chcss'};
    graphContext["@context"][chcss_prefix.data] = CHCS_NS;
    parsedData["@context"] = graphContext["@context"];
    parsedData["@graph"] = parsedData["@graph"].filter(function (ob) {
        // Filter to known types for cleaned.jsonld, 2.1 w, 4.2 w/o
        return ob.type.substr(1 + chcss_prefix.data.length) in myTypeToShape;
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
            '@context': {
                "@vocab": "http://hl7.org/fhir/",
                "xsd": "http://www.w3.org/2001/XMLSchema#"
            },
            '@id': target_graph.data,
            '@graph': jsonld['@graph'] || jsonld
        },
        {
            '@context': {
                "meta": "urn:meta#",
                "@vocab": "http://hl7.org/fhir/",
                "prov": "http://www.w3.org/ns/prov#",
                "xsd": "http://www.w3.org/2001/XMLSchema#"
            },
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
        '@context': {
            "@vocab": "http://hl7.org/fhir/",
            "xsd": "http://www.w3.org/2001/XMLSchema#"
        },
        '@id': target_graph.data,
        '@graph': jsonld['@graph'] || jsonld
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
        "@vocab": CHCS_NS,
        "chcss": CHCS_NS,
        "prov": "http://www.w3.org/ns/prov#",
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
