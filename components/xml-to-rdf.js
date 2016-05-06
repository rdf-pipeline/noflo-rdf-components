// xml-to-rdf.js

var _ = require('underscore');

var fs = require('fs');
var readline = require('readline');

var xslt4node = require('xslt4node');
var first=true;

var helper = require('../src/component-helper');
var createState = require('../src/create-state');
var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper(xmlToRdf);

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
 * @param {string} outdir path to the directory where rdf file should be written
 *
 * @return {array} FHIR RDF translations for each of sources files
 */
function xmlToRdf(sources, classpath, transform, outdir) {

    // console.log('enter xmlToRdf with ',arguments);

    if (_.isUndefined(sources) || _.isUndefined(transform)) {
        throw Error("Xml-to-rdf component expects both sources and transform parameters!");
        return;
    }

    // Get the sources as an array.  If coming from another component, it will generally
    // already be an array.  If coming in as an IIP from the GUI, it may be a string that 
    // we have to parse to get the array content.
    var parsedSources = (_.isString(sources)) ? JSON.parse(sources) : sources;

    // Add the classpath the first time through.  After that we'll have it.
    if (first && ! _.isUndefined(classpath)) { 
        xslt4node.addLibrary(classpath);
        first = false;
    }

    var promiseFactories =  _.map( sources, function( source ) {
        return _.partial( processSource, source, classpath, transform, outdir );
    });
    var results = Promise.resolve( executeSequentially( promiseFactories ) );

    return Promise.resolve(results);
}

function executeSequentially(promiseFactories) {
    var result = Promise.resolve();
    var results = [];
    promiseFactories.forEach(function (promiseFactory, index) {
       result = result.then( promiseFactory );
       results.push( result );
    });
    return Promise.all( results );
}

/**
 * Process a source FHIR XML file into an RDF file
 * 
 * @param source {string} path to the xml source file to be processed
 * @param {string} classpath classpath to transform library
 * @param {string} transform file path to xslt transform file
 *
 * @return an updated config object with the docParam setting containing the URN to to be used 
 *         as the doc root for the rdf resource we'll be generating.
 */
function processSource(source, classpath, transform, outdir) { 
 
    return new Promise( function(resolve, reject) { 
        var fileName = '';

        // Use a stream to avoid reading it all into memory at once
        var reader = readline.createInterface({
            input: fs.createReadStream(source)
        });
        reader.on('line', function (line) {
            if (! _.isEmpty(fileName)) { 
                // Processed our file so now we can shut this reader down
                reader.destroy();
            }

            if (line.match(/^<id value=\"urn\:local\:fhir\:/)) {
                var uri = line.match(/^<id value=\"([A-Za-z0-9\:\-_]+).*/);
                if (!_.isEmpty(uri)) {
                    var rdf = 
                       xslt4node.transformSync({
                          xsltPath: transform,
                          result: String,
                          sourcePath: source,
                          params: {docParam: '<'+uri[1]+'>'}
                       });
                    fileName = outdir+uri[1]+'.ttl';
                    fs.writeFileSync(fileName, rdf);
                    resolve(fileName);
                }
            }
        }); 

        reader.on('error', function() {
            if (_.isEmpty(fileName)) {
               reject('Unable to find the RDF resource id in file '+source);
            }
        });

        reader.on('end', function() {
            if (_.isEmpty(fileName)) {
               reject('Unable to find the RDF resource id in file '+source);
            }
        });

    });
}
