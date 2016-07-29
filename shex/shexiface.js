"use strict";

// var RDFStore = require("rdfstore");
var fs = require("fs");
var util=require("util");

var N3 = require("n3");
var N3Util = N3.Util;
var ShEx = require("shex");
var ShExLoader = ShEx.Loader;
var ShExValidator = ShEx.Validator;
var Mapper = ShEx.Mapper;
var ShExDir = __dirname+"/";
var start = Date.now();

var RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";

// constants
var PROV_DERIVED = "http://www.w3.org/ns/prov#wasDerivedFrom";

var NextNode = 0;

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
	            return resolve(ShEx.Parser().parse(res));
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
            //              key in typeToShape, ent ? typeToShape[key].from !== null : null, ent ? typeToShape[key].to !== null : null);
        }

        return ret;
    }, [])).then(function (log) {
          targetFixup(toGraph);
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
        return false;
    }

    var resultBindings = validator.semActHandler.results["http://shex.io/extensions/Map/#"];
    Object.keys(staticBindings).forEach(function (k) {
        resultBindings[k] = staticBindings[k];
    });

    // now("resultBindings:", resultBindings);
    var map = Mapper.materializer(toSchema, nextBNode);
    map.materialize(resultBindings, toNode, toGraph);

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
    var base = 'http://hokukahu.com/systems/cmumps-1/';
    var writer = N3.Writer({
	prefixes: {
	    '': 'http://hokukahu.com/schema/cmumpss#',
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

function HokukahuMapper (fromGraph, fromFormat, toFormat) {
    var myBase = "http://hokukahu.com/schema/" + fromFormat + "#";
    var fhir = require("./targets/" + toFormat);
    var cmumpsIDPredicate = "http://hokukahu.com/schema/" + fromFormat + "#identifier";
    var myCreateRootBase = "urn:local:" + toFormat + ":";
    function makeTargetNode (key, s) {
	return myCreateRootBase + myTypeToShape[key].targetType + ":" +
	    N3Util.getLiteralValue(fromGraph.find(s, cmumpsIDPredicate, null)[0].object);
    }
    return ShExMapGraph(fromGraph, myTypeToShape, myBase,
			fhir.staticBindings, makeTargetNode, fhir.targetFixup);
}

module.exports = {
    ShExMapPerson:function (g) { return HokukahuMapper(g, "cmumpss", "fhir"); },
    now:now,
    type2shape:myTypeToShape
};

