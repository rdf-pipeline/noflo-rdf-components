#!/usr/bin/env node

// ShEx test tool

var component = require("../components/shex-cmumps-to-rdf");
var fs = require('fs');

var data = fs.readFileSync(process.argv[2]);

var ret = component.updater(data);
if (ret instanceof Promise) {

  ret.then( function (r) { 
      console.warn("resolved:", r.length, "chars") 
  }).catch(function (r) { 
      console.warn("caught:", r) 
  });

} else {
    console.warn("returned:", ret);
}
