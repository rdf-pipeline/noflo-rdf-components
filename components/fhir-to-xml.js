/**
 * File:  fhir-to-xml.js
 */

var _ = require('underscore');

var jswrapper = require('../src/javascript-wrapper');
var fhir2xml = require('../../FHIR-JSON-to-XML-Converter/FHIR JSON to XML Converter/dist/node-fhir-convert');

exports.getComponent = jswrapper({

    name: "fhir-to-xml",
    description: "converts FHIR data to XML format",

    inPorts: { 
        fhir: { 
            datatype: 'object',
            description: "a FHIR object to be converted to xml",
            required: true
        }
    },

    updater: function( fhir ) {  

       var fhirJsonToXml = new fhir2xml.FHIRConverter();

       var xml;
       if ( _.isArray( fhir )) { 
          xml = _.map( fhir, function( obj ) {
               return fhirJsonToXml.toXML( obj );
          });
       } else { 
          xml = fhirJsonToXml.toXML( fhir );
       }

       return xml.toString();
    }
});
