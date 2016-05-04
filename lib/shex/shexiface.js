"use strict";

// var RDFStore = require("rdfstore");
var fs = require("fs");
var N3 = require("n3");
var N3Util = N3.Util;
var ShEx = require("shex");
var ShExLoader = ShEx.Loader;
var ShExValidator = ShEx.Validator;
var Mapper = ShEx.Mapper;
var ShExDir = __dirname+"/";
var start = Date.now();

var RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
var PATCH_ME = "tag:eric@w3.org,2016:PatchMe";

function now () {
  var args = Array.prototype.slice.call(arguments);
  var at = Date.now();
  args.unshift((at - start)/1000);
  start = at; // if you want delta vs cumulative time
  return console.warn.apply(console, args);
}

// constants
var PROV_DERIVED = "http://www.w3.org/ns/prov#wasDerivedFrom";

var BASE = "http://hokukahu.com/schema/cmumpss#";
var type2shape = {
  "Order-101":    { from: null, to: null, FHIR_type: null, CMUMPS_path: "orders" },
  "101_03":       { from: null, to: null, FHIR_type: null, CMUMPS_path: "orders/qa_event_date-101" },
  "101_05":       { from: null, to: null, FHIR_type: null, CMUMPS_path: "orders/status_change-101" },
  "101_11":       { from: null, to: null, FHIR_type: null, CMUMPS_path: "orders/order_required_data-101" },
  "Result-63_07": { from: "CMUMPS_result.shex", to: "FHIR_DiagnosticReport.shex", FHIR_type: "DiagnosticReport", CMUMPS_path: "labs/clinical_chemistry-63/result-63_04" },
  // "11_07":     { from: null, to: null, FHIR_type: null, CMUMPS_path: "labs/clinical_chemistry-63/result-63_04" },
  "2":            { from: null, to: null, FHIR_type: null, CMUMPS_path: "demographics" },
  "2_03":         { from: null, to: null, FHIR_type: null, CMUMPS_path: "demographics/medical_record_type-2" },
  "2_4":          { from: null, to: null, FHIR_type: null, CMUMPS_path: "demographics/user_altering_patient_record-2" },
  "Patient_Appointment-44_2": { from: null, to: null, FHIR_type: null, CMUMPS_path: "appointments" },
  "52":           { from: null, to: null, FHIR_type: null, CMUMPS_path: "medsop" },
  "52_00":        { from: null, to: null, FHIR_type: null, CMUMPS_path: "medsop/activity_log-52" },
  "52_01":        { from: null, to: null, FHIR_type: null, CMUMPS_path: "medsop/fill_dates-52" },
  "55":           { from: null, to: null, FHIR_type: null, CMUMPS_path: "medsinp" },
  //"63":         { from: "patient_labs_cmumps.shex", to: "patient_labs_fhir.shex", FHIR_type: null, CMUMPS_path: "labs" },
  "Lab_Result-63": { from: null, to: null, FHIR_type: null, CMUMPS_path: "labs" },
  "Clinical_Chemistry-63_04": { from: "CMUMPS_clinical_chemistry.shex", to: "FHIR_DiagnosticOrder.shex", FHIR_type: "DiagnosticOrder", CMUMPS_path: "labs/clinical_chemistry-63" },
  // "63_04":     { from: null, to: null, FHIR_type: null, CMUMPS_path: "labs/clinical_chemistry-63" },
  "63_832":       { from: null, to: null, FHIR_type: null, CMUMPS_path: "labs/performing_lab_disclosures-63_04" },
  "8810":         { from: null, to: null, FHIR_type: null, CMUMPS_path: "allergies" },
  "Medication_Profile-8810_3": { from: null, to: null, FHIR_type: null, CMUMPS_path: "allergies/drug_allergy-8810" },
  "Patient-2":    { from: null, to: null, FHIR_type: null, CMUMPS_path: "patient" },
}

// Load each schema on demand.
function schemaPromise (key, fromto) {
  var saveAs = fromto + "Ob";
  if (!(saveAs in type2shape[key]))
    type2shape[key][saveAs] = new Promise(function (resolve, reject) {
      var txt = fs.readFile(ShExDir + type2shape[key][fromto], "utf-8", function (err, res) {
	if (err) return reject(err);
	try {
	  // now("loaded type2shape[" + key + "][" + saveAs + "]");
	  return resolve(ShEx.Parser().parse(res));
	} catch (e) {
	  reject(e);
	}
      });
    });
  return type2shape[key][saveAs];
}

var StaticBindings = { // constants like code systems, etc.
  "http://hokukahu.com/map/subject.idsystem": "\"http://lpi-cmumps.org/patients/\"",
  "http://hokukahu.com/map/order.idsystem": "\"http://lpi-cmumps.org/order/\"",
  "http://hokukahu.com/map/specimen.codesystem": "\"http://lpi-cmumps.org/specimen/\"",
  "http://hokukahu.com/map/container.codesystem": "\"http://lpi-cmumps.org/container/\"",
  "http://hokukahu.com/map/Observation.codesystem": "\"http://lpi-cmumps.org/observation/\"",
};

var CreateRootBase = "urn:local:cmumps:";
var NextNode = 0;

function ShExMapPerson (fromGraph) {
  var toGraph = N3.Store();
  var typeArcs = fromGraph.find(null, RDF_TYPE, null);
  // now("got " + typeArcs.length + " type arcs");
  return Promise.all(typeArcs.reduce(function (ret, typeArc) {
    var key = typeArc.object.substr(BASE.length);
    if (key in type2shape && type2shape[key].from && type2shape[key].to) {
      return ret.concat(Promise.all([
	schemaPromise(key, "from"),
	schemaPromise(key, "to")
      ]).then(function (schemas) {
	var nodeID = N3Util.getLiteralValue(fromGraph.find(typeArc.subject, "http://hokukahu.com/schema/cmumpss#identifier", null)[0].object);
	var toNode = CreateRootBase + type2shape[key].FHIR_type + ":" + nodeID;
	//if above fails, use this? CreateRootBase + type2shape[key].FHIR_type + ":" + NextNode;
	if (mapLoadedShapes (schemas[0], schemas[1], fromGraph, toGraph, typeArc.subject, toNode, StaticBindings)) {
	  NextNode++;
	  toGraph.addTriple({subject: toNode, predicate: PROV_DERIVED, object: typeArc.subject});
	  return { passed: typeArc.subject };
	} else {
	  // console.warn(key, typeArc.subject);
	  return { failed: typeArc.subject };
	}
      }));
    } else {
      var ent = type2shape[key];
      // console.warn("ignoring " + key, key in type2shape, ent ? type2shape[key].from !== null : null, ent ? type2shape[key].to !== null : null);
    }
    return ret;
  }, [])).
    then(function (log) {
      patchIdentifierLinks(toGraph);
      now("Shexiface processed", log.length, " Diagnostic records.");
      return {data:toGraph, log:log};
    });
}

function patchIdentifierLinks (graph) {
  graph.find(null, "http://hl7.org/fhir/link", PATCH_ME).forEach(function (patchArc) {
    graph.find(null, null, patchArc.subject).forEach(function (referentArc) {
      graph.find(referentArc.subject, RDF_TYPE, null).forEach(function (referentTypeArc) {
	graph.find(patchArc.subject, "http://hl7.org/fhir/Identifier.value", null).forEach(function (idValueArc) {
	  graph.find(idValueArc.object, "http://hl7.org/fhir/value", null).forEach(function (idValueValueArc) {
	    graph.removeTriple(patchArc);
	    patchArc.object = CreateRootBase + referentTypeArc.object.substr("http://hl7.org/fhir/".length) + ":" + N3Util.getLiteralValue(idValueValueArc.object);
	    graph.addTriple(patchArc);
	  });
	});
      });
    });
  });
}

var blankNodeCount = 0;
function nextBNode () {
  return "_:b" + blankNodeCount++;
}

function mapLoadedShapes (fromSchema, toSchema, fromGraph, toGraph, fromNode, toNode, staticBindings) {

  // prepare validator
  var validator = ShExValidator.construct(fromSchema);
  Mapper.register(validator);

  // run validator
  if (!validator.validate(fromGraph, fromNode, null))
    return false;
  var resultBindings = validator.semActHandler.results["http://shex.io/extensions/Map/#"];
  Object.keys(staticBindings).forEach(function (k) {
    resultBindings[k] = staticBindings[k];
  });
  // now("resultBindings:", resultBindings);
  var map = Mapper.materializer(toSchema, nextBNode);
  map.materialize(resultBindings, toNode, toGraph);
  return true;
}


module.exports = { ShExMapPerson:ShExMapPerson, now:now, type2shape:type2shape };

