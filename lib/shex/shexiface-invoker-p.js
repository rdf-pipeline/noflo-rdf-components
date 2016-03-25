#!/usr/bin/env node

var rs = require("rdfstore");
var Promise = require("bluebird");
var jsonld = require("jsonld");
var shexiface = require("./shexiface");

// Patient data has comments so use require to load it.
// var fakeData  = require("./CHCSfakePatient.js");
var fakeData  = require(process.argv[2]);
// Force local copy of @context.
fakeData["@context"] = require("./CHCSfakeContext.js")["@context"];
// fakeData["@context"] = require(process.argv[2])["@context"];
// Duplicate ids and _ids.
function duplicateScalars (object, copyMez, newKey) {
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
duplicateScalars(fakeData, ["id", "_id"], "identifier");


var IN_GRAPH = "http://the.in.graph/";
var OUT_GRAPH = "http://the.out.graph/";

new Promise (function (resolve, reject) {
  rs.create({}, function (errors, store) {
    if (errors) reject(errors);
    resolve(store);
  });
}).then(function (store) {
  return new Promise(function (resolve, reject) {
    store.load("application/ld+json", fakeData, IN_GRAPH, function(err,results) {
      resolve(store);
    });
  });
}).then(function (store) {
  return Promise.all([
    store, // graph,
    new Promise(function (resolve, reject) {
      store.graph(IN_GRAPH, function (errors, graph) {
	if (errors) reject(errors);
	resolve(graph);
      })}),
    new Promise(function (resolve, reject) {
      store.graph(OUT_GRAPH, function (errors, graph) {
	if (errors) reject(errors);
	resolve(graph);
      })})
  ]).spread(function (store, inGraph, outGraph) {
    return shexiface.ShExMapPerson(store, inGraph, outGraph).then(function () {
      console.log(outGraph.toNT());
    });
  });
}).catch (function (e) {
  console.warn("catch:", e.stack || e);
});
