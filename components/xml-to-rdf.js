// xml-to-rdf.js

var _ = require('underscore');

var xslt4node = require('xslt4node');
var first=true;

var helper = require('../src/component-helper');
var createState = require('../src/create-state');
var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper( xmlToRdf );

/**
 * Perform an xslt transform converting the xml to RDF turtle format using
 * the xslt4node package with the Saxon library.  
 *
 * NOTE: xslt4node depends on the Java & async packages.  A side-effect of running the
 * Java package is that it interferes with interrupts e.g., SIGINT.  If you use this 
 * package in the pipeline, node.js will not be interruptable. 
 *
 * @this vni context
 * @param {array} sources xml files to be processed; noflo GUI can also send it as a string
 * @param {string} classpath classpath to transform library
 * @param {string} transform file path to xslt transform file
 *
 * @return {array} FHIR RDF translations for each of sources files
 */
function xmlToRdf(sources, classpath, transform) {

    if (_.isUndefined(sources) || _.isUndefined(transform)) {
        throw Error("Xml-to-rdf component expects both sources and transform parameters!");
        return;
    }

    // Get the sources as an array.  If coming from another component, it will generally
    // already be an array.  If coming in as an IIP from the GUI, it may be a string that 
    // we have to parse to get the array content.
    var parsedSources = (_.isString(sources)) ? JSON.parse(sources) : sources;

    // Set up the xslt transform configuration
    var config = {
        xsltPath: transform,
        result: String,
    }

    // Add the classpath the first time through.  After that we'll have it.
    if (first && ! _.isUndefined(classpath)) { 
        xslt4node.addLibrary(classpath);
        first = false;
    }

    // Walk the list of sources, transform each one, and send each on to the next component
    var result = [];
    parsedSources.forEach(function(source) { 
        config.sourcePath = source; 
        result.push(xslt4node.transformSync(config));
    });

    return result;
}

