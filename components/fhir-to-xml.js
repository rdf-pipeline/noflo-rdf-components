/**
 * File:  fhir-to-xml.js
 */

var _ = require('underscore');
var fs = require('fs');

// var fhir2xml = require('../../FHIR-JSON-to-XML-Converter/FHIR JSON to XML Converter/dist/node-fhir-convert');
// var fhir2xml = require('../../rdftransforms/node_modules/fhir-json-to-xml/dist/fhir-convert');
var fhir2xml = require('fhir-json-to-xml');

var jswrapper = require('../src/javascript-wrapper');
var createLm = require('../src/create-lm');

exports.getComponent = jswrapper({

    name: "fhir-to-xml",
    description: "converts FHIR data to XML format",

    inPorts: { 
        fhir: { 
            datatype: 'object',
            description: "a FHIR object to be converted to xml",
            required: true
        },
        outdir: {
            datatype: 'string',
            description: "an output directory path",
            required: true
        }
    },

    updater: function( fhir, outdir ) {  

       console.log('\nenter fhir-to-xml with ', fhir);
       var fhirJsonToXml = new fhir2xml.FHIRConverter();

       var fhirXml;
       var xmlFileName;
       var xmlFileNames;

       if ( _.isArray( fhir )) { 
           
          xmlFileNames = _.map( fhir, function( obj ) {
               console.log('\nfhir to xml object to convert: ',obj,'\n');
               var obj2 = _.pick( obj, function(value, key, object) { 
                   return ( key !== 'extension'  );
               }); 
               fhirXml =  fhirJsonToXml.toXML( obj2 ); // .replace(/<([^>?]+)>/, "<$1 xmlns=\"http://hl7.org/fhir\">");
               // fhirXml =  fhirJsonToXml.toXML( obj ); 
               xmlFileName = outdir+'/fhir-'+createLm()+'.xml';
               console.log('\nwrite file: ',xmlFileName,'\n');
               fs.writeFileSync(xmlFileName, fhirXml.toString());
               return xmlFileName; 
          });

       } else { 
           var obj2 = _.pick( fhir, function(value, key, object) { 
               return ( key !== 'extension' );
           }); 
          fhirXml =  fhirJsonToXml.toXML( obj2 ); 
          // fhirXml = fhirJsonToXml.toXML( fhir );  // .replace(/<([^>?]+)>/, "<$1 xmlns=\"http://hl7.org/fhir\">");
          xmlFileName = outdir+'/fhir-'+createLm()+'.xml';
          console.log('write file: ',xmlFileName);
          fs.writeFileSync(xmlFileName, fhirXml.toString());
          xmlFileNames = [ xmlFileName ];
       }

       console.log( 'FHIR XML file names = ',xmlFileNames );
       return xmlFileNames; 
    }
});
