"use strict";

// var RDFStore = require("rdfstore");
var fs = require("fs");
var N3 = require("n3");
var N3Util = N3.Util;
var ShEx = require("shex");
var ShExLoader = ShEx.Loader;
var ShExValidator = ShEx.Validator;
var Mapper = ShEx.Mapper;
var ShExDir = "./lib/shex/";
var start = Date.now();

function now () {
  var args = Array.prototype.slice.call(arguments);
  var at = Date.now();
  args.unshift((at - start)/1000);
  start = at; // if you want delta vs cumulative time
  return console.warn.apply(console, args);
}

// constants
var PROV_DERIVED = "http://www.w3.org/ns/prov#wasDerivedFrom";

var BASE = "http://hokukahu.com/schema/chcss#";
var type2shape = {
  "Order-101":    { mapped: 0, from: null, to: null, what: "orders" },
  "101_03":       { mapped: 0, from: null, to: null, what: "orders/qa_event_date-101" },
  "101_05":       { mapped: 0, from: null, to: null, what: "orders/status_change-101" },
  "101_11":       { mapped: 0, from: null, to: null, what: "orders/order_required_data-101" },
  "Result-63_07": { mapped: 0, from: "CHCS_result.shex", to: "FHIR_DiagnosticReport.shex", what: "labs/clinical_chemistry-63/result-63_04" },
  // "11_07":     { mapped: 0, from: null, to: null, what: "labs/clinical_chemistry-63/result-63_04" },
  "2":            { mapped: 0, from: null, to: null, what: "demographics" },
  "2_03":         { mapped: 0, from: null, to: null, what: "demographics/medical_record_type-2" },
  "2_4":          { mapped: 0, from: null, to: null, what: "demographics/user_altering_patient_record-2" },
  "Patient_Appointment-44_2": { mapped: 0, from: null, to: null, what: "appointments" },
  "52":           { mapped: 0, from: null, to: null, what: "medsop" },
  "52_00":        { mapped: 0, from: null, to: null, what: "medsop/activity_log-52" },
  "52_01":        { mapped: 0, from: null, to: null, what: "medsop/fill_dates-52" },
  "55":           { mapped: 0, from: null, to: null, what: "medsinp" },
  //"63":         { mapped: 0, from: "patient_labs_chcs.shex", to: "patient_labs_fhir.shex", what: "labs" },
  "Lab_Result-63": { mapped: 0, from: null, to: null, what: "labs" },
  "Clinical_Chemistry-63_04": { mapped: 0, from: "CHCS_clinical_chemistry.shex", to: "FHIR_DiagnosticOrder.shex", what: "labs/clinical_chemistry-63" },
  // "63_04":     { mapped: 0, from: null, to: null, what: "labs/clinical_chemistry-63" },
  "63_832":       { mapped: 0, from: null, to: null, what: "labs/performing_lab_disclosures-63_04" },
  "8810":         { mapped: 0, from: null, to: null, what: "allergies" },
  "Medication_Profile-8810_3": { mapped: 0, from: null, to: null, what: "allergies/drug_allergy-8810" },
  "Patient-2":    { mapped: 0, from: null, to: null, what: "patient" },
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
  "http://hokukahu.com/map/subject.idsystem": "\"http://lpi-chcs.org/patients/\"",
  "http://hokukahu.com/map/order.idsystem": "\"http://lpi-chcs.org/order/\"",
  "http://hokukahu.com/map/specimen.codesystem": "\"http://lpi-chcs.org/specimen/\"",
  "http://hokukahu.com/map/container.codesystem": "\"http://lpi-chcs.org/container/\"",
  "http://hokukahu.com/map/Observation.codesystem": "\"http://lpi-chcs.org/observation/\"",
};

var CreateRootBase = "http://lpi-chcs.org/translated/";
var NextNode = 0;

function ShExMapPerson (fromGraph) {
  var toGraph = N3.Store();
  var typeArcs = fromGraph.find(null, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", null);
  // now("got " + typeArcs.length + " type arcs");
  return Promise.all(typeArcs.reduce(function (ret, typeArc) {
    var key = typeArc.object.substr(BASE.length);
    if (key in type2shape && type2shape[key].from && type2shape[key].to) {
      return ret.concat(Promise.all([
	schemaPromise(key, "from"),
	schemaPromise(key, "to")
      ]).then(function (schemas) {
	var toNode = CreateRootBase + type2shape[key].what + "/" + NextNode;
	if (mapLoadedShapes (schemas[0], schemas[1], fromGraph, toGraph, typeArc.subject, toNode, StaticBindings)) {
	  NextNode++;
	  type2shape[key].mapped++;
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
      console.log("Shex processed",log.length,"diagnostic records.");
      // now("Shexiface processed", log.length, " Diagnostic records.");
      return {data:toGraph, log:log};
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
  //  now("resultBindings:", resultBindings);
  var map = Mapper.materializer(toSchema, nextBNode);
  map.materialize(resultBindings, toNode, toGraph);
  return true;
}


module.exports = { ShExMapPerson:ShExMapPerson, now:now, type2shape:type2shape };

