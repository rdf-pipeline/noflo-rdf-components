"use strict";

var Promise = require("bluebird");
var RDFStore = require("rdfstore");
var N3 = require("../../node_modules/rdfstore/node_modules/n3/N3.js");
// var N3 = require("./node_modules/rdfstore/node_modules/n3/N3.js"); // rdfstore has hardwired paths so we have to make sure npm doesn't install n3 anywhere else.
var N3Util = N3.Util;
var ShEx = require("shex");
var ShExLoader = ShEx.Loader;
var ShExValidator = ShEx.Validator;
var Mapper = ShEx.Mapper;

// constants
var PROV_DERIVED = "http://www.w3.org/ns/prov#wasDerivedFrom";

function ShExMapPerson (store, inGraph, outGraph) {
  var inN3graph = N3.Store();
  RDFstore2N3store(inGraph, inN3graph);
  return crawlAndMap(inN3graph).then(function (outN3graph) {
    N3store2RDFstore(outN3graph, outGraph, store);
    return outGraph;
  });
}

var BASE = "http://hokukahu.com/schema/chcss#";

var type2shape = {
  "Order-101":     { expect: 7, mapped: 0, from: null, to: null, what: "orders" },
  "101_03":  { expect: 2, mapped: 0, from: null, to: null, what: "orders/qa_event_date-101" },
  "101_05":  { expect: 2, mapped: 0, from: null, to: null, what: "orders/status_change-101" },
  "101_11":  { expect: 1, mapped: 0, from: null, to: null, what: "orders/order_required_data-101" },
  "Result-63_07":   { expect: 9, mapped: 0, from: "./lib/shex/CHCS_result.shex", to: "./lib/shex/FHIR_DiagnosticReport.shex", what: "labs/clinical_chemistry-63/result-63_04" },
  // "11_07":   { expect: 9, mapped: 0, from: null, to: null, what: "labs/clinical_chemistry-63/result-63_04" },
  "2":       { expect: 1, mapped: 0, from: null, to: null, what: "demographics" },
  "2_03":    { expect: 1, mapped: 0, from: null, to: null, what: "demographics/medical_record_type-2" },
  "2_4":     { expect: 1, mapped: 0, from: null, to: null, what: "demographics/user_altering_patient_record-2" },
  "Patient_Appointment-44_2":    { expect: 8, mapped: 0, from: null, to: null, what: "appointments" },
  "52":      { expect: 2, mapped: 0, from: null, to: null, what: "medsop" },
  "52_00":   { expect: 4, mapped: 0, from: null, to: null, what: "medsop/activity_log-52" },
  "52_01":   { expect: 2, mapped: 0, from: null, to: null, what: "medsop/fill_dates-52" },
  "55":      { expect: 1, mapped: 0, from: null, to: null, what: "medsinp" },
  //"63":      { expect: 1, mapped: 0, from: "./lib/shex/patient_labs_chcs.shex", to: "./lib/shex/patient_labs_fhir.shex", what: "labs" },
  "Lab_Result-63":      { expect: 1, mapped: 0, from: null, to: null, what: "labs" },
  "Clinical_Chemistry-63_04":   { expect: 4, mapped: 0, from: "./lib/shex/CHCS_clinical_chemistry.shex", to: "./lib/shex/FHIR_DiagnosticOrder.shex", what: "labs/clinical_chemistry-63" },
  // "63_04":   { expect: 4, mapped: 0, from: null, to: null, what: "labs/clinical_chemistry-63" },
  "63_832":  { expect: 1, mapped: 0, from: null, to: null, what: "labs/performing_lab_disclosures-63_04" },
  "8810":    { expect: 1, mapped: 0, from: null, to: null, what: "allergies" },
  "Medication_Profile-8810_3": { expect: 1, mapped: 0, from: null, to: null, what: "allergies/drug_allergy-8810" }
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

function crawlAndMap (fromGraph) {
  // return Promise.resolve(fromGraph); // for debugging: show input graph
  var toGraph = N3.Store();
  var typeArcs = fromGraph.find(null, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", null);
  var promises = [];
  typeArcs.forEach(function (t) {
    var key = t.object.substr(BASE.length);
    if (key in type2shape && type2shape[key].from !== null && type2shape[key].to !== null) {
      promises.push(
        Promise.all([ShExLoader.load([type2shape[key].from], [], [], []),
                     ShExLoader.load([type2shape[key].to]  , [], [], [])]).
          spread(function (fromSchema, toSchema) {
            var toNode = CreateRootBase + type2shape[key].what + "/" + NextNode;
            if (mapLoadedShapes (fromSchema.schema, toSchema.schema, fromGraph, toGraph, t.subject, toNode, StaticBindings)) {
              NextNode++;
              type2shape[key].mapped++;
              toGraph.addTriple({subject: toNode, predicate: PROV_DERIVED, object: t.subject});
              return { passed: t.subject };
            } else {
	    console.warn(key, t.subject);
              return { failed: t.subject };
            }
          })
      );
    } else {
      var ent = type2shape[key];
      // console.warn("ignoring " + key, key in type2shape, ent ? type2shape[key].from !== null : null, ent ? type2shape[key].to !== null : null);
    }
  });
  // console.log(type2shape); // how did we do?
  return Promise.all(promises).then(function (all) {
//    console.log(all);
    return toGraph;
  });
}

var blankNodeCount = 0;
function nextBNode () {
  return '_:b' + blankNodeCount++;
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
//  console.log("resultBindings:", resultBindings);
  var map = Mapper.materializer(toSchema, nextBNode);
  map.materialize(resultBindings, toNode, toGraph);
  return true;
}


function RDFstore2N3store (rsgraph, n3graph) {
  rsgraph.triples.forEach(function (rst) {
    function t2t (term) {
      switch (term.interfaceName) {
      case 'BlankNode':
        return term.nominalValue;
      case 'NamedNode':
        return term.nominalValue;
      case 'Literal':
        return "\"" + term.nominalValue + "\"" +
          (term.datatype ? "^^" + term.datatype : "") +
          (term.language ? "@" + term.language : "");
      default:
        throw Error("unknown rdfstore node type: " + JSON.stringify(term.interfaceName));
      }
    }
    n3graph.addTriple(t2t(rst.subject), t2t(rst.predicate), t2t(rst.object));
  });
}

function N3store2RDFstore (n3graph, rsgraph, store) {
  var bnodeMap = {};
  n3graph.find(null, null, null).forEach(function (n3t) {
    function t2t (term) {
      if (N3Util.isIRI(term)) {
        return store.rdf.createNamedNode(term);
      }

      if (N3Util.isLiteral(term)) {
        var v = N3Util.getLiteralValue(term);
        var t = N3.Util.getLiteralType(term) || null;
        var l = N3.Util.getLiteralLanguage(term) || null;
        return store.rdf.createLiteral(v, l, t);
      }

      if (N3Util.isBlank(term)) {
        var v = term.substr(2);
        if (!(v in bnodeMap))
          bnodeMap[v] = store.rdf.createBlankNode();
        return bnodeMap[v];
      }

      throw Error("unknown rdfstore node type: " + JSON.stringify(term.interfaceName));
    }
    rsgraph.add(store.rdf.createTriple(t2t(n3t.subject),
                                       t2t(n3t.predicate),
                                       t2t(n3t.object)));
  });
}

module.exports = { ShExMapPerson:ShExMapPerson };

