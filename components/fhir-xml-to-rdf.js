/**
 * File: fhir-xml-to-rdf.js
 * 
 * 'java -classpath /Library/Java/Extensions/SaxonHE9-7-0-4J/saxon9he.jar net.sf.saxon.Transform -xsl:transform.xsl -s:medicationdispenseexample1.xml fhirdefs=definitions.xml'
 */

var _ = require('underscore');

var jswrapper = require('../src/javascript-wrapper');
var createState = require('../src/create-state');

var exec = require('child_process').exec;

exports.getComponent = jswrapper({

    name: "fhir-xml-to-rdf",
    description: "converts FHIR XML to RDF",

    inPorts: { 
        classpath: {
            datatype: 'string',
            description: "java classpath for the host system",
            required: false
        },
        sources: { 
            datatype: 'object',
            description: "Array of FHIR XML files to be translated",
            required: true
        },
        definitions: { 
            datatype: 'string',
            description: "file path to the fhir definitions file",
            required: true
        },
        transform: { 
            datatype: 'string',
            description: "file path to the transformation xsl file",
            required: true
        }
    },

    /** 
     * Convert FHIR XML to FHIR RDF format
     * 
     * @param sources
     * @param classpath
     * @param definitions
     * @param transform
     * 
     * @return FHIR RDF
     */
    updater: function( sources, classpath, definitions, transform ) {   

        // console.log('\nEnter fhir-xml-to-rdf:',sources);
        var vni = this;

        return Promise.all(  _.map( sources, function( source ) { 
            var command = 'java -classpath '+classpath+' net.sf.saxon.Transform -xsl:'+transform +
                          ' -s:'+source+' fhirdefs='+definitions;
            console.log('executing '+command);
            return new Promise( function( resolve, reject ) { 
                 exec(command, {timeout:0, cwd: '/Users/glennamayo/src/noflo-rdf-components' }, function(error, stdout, stderr) {

                     if ( error !== null ) { 
                         console.log('error: ',error);
                         reject( error );
                     }
                     if ( ! _.isEmpty(stderr) ) { 
                         console.log('stderr: ',stderr);
                         reject( stderr );
                     }
     
                     // console.log('stdout:',stdout);
                     resolve( stdout );
                 });
            });
          }));
   }
});
