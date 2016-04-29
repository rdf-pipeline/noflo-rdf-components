#!/usr/bin/env node

var updater = require("../../components/shex-chcs-to-rdf");
var ret = updater(JSON.parse(require("fs").readFileSync(process.argv[2])));
if (ret instanceof Promise)
  ret.
  then(function (r) { console.warn("resolved:", r.length, "chars") }).
  catch(function (r) { console.warn("caught:", r) });
else
  console.warn("returned:", ret);
