// xml-to-rdf.js

var _ = require('underscore');

var fs = require('fs');
var readline = require('readline');

var xslt4node = require('xslt4node');
var first=true;

var logger = require('../src/logger');
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

    logger.debug('Enter', {arguments: arguments, nodeInstance: this.nodeInstance});

    if (_.isUndefined(sources) || _.isUndefined(transform) || _.isUndefined(outdir)) {
        throw Error("Xml-to-rdf component expects sources, fhir-xml-to-rdf xslt, and outdir parameters!");
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

/**
 *  Process each input source file sequentially - don't let them overload the system
 * 
 * @param promiseFactories a factory that will execute a promise for each source file
 *
 * @return an array of with the promise results of each factory
 */ 
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
 * @return the file name holding the RDF 
 */
function processSource(source, classpath, transform, outdir) { 
 
    return new Promise( function(resolve, reject) { 
        var fileName = '';

        // Use a stream to avoid reading the xml all into memory at once
        var reader = readline.createInterface({
            input: fs.createReadStream(source)
        });

        // Start by reading the file one line at a time.  We will stop 
        // reading once we have the resource ID
        reader.on('line', function (line) {

            if (! _.isEmpty(fileName)) { 
                // Processed our file so now we can shut this reader down
                // if something else didn't get it first
                if (_.isFunction(reader.destroy)) { 
                    reader.destroy();
                }
            }

            // Do we have a fhir resource ID?
            if (line.match(/^<id value=\"urn\:local\:fhir\:/)) {

                // extract the ID URI
                var uri = line.match(/^<id value=\"([A-Za-z0-9\:\-_]+).*/);
                if (!_.isEmpty(uri)) {
                    // convert file to XML and use the URI as the RDF document root
                    var rdf = 
                       xslt4node.transformSync({
                          xsltPath: transform,
                          result: String,
                          sourcePath: source,
                          params: {docParam: '<'+uri[1]+'>'}
                       });

                    // Write the file
                    fileName = outdir+uri[1]+'.ttl';
                    fs.writeFileSync(fileName, rdf);
                    logger.debug('wrote file', {fileName: fileName, nodeInstance: this.nodeInstance});
 
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
