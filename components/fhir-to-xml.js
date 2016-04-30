// fhir-to-xml.js

var _ = require('underscore');
var fs = require('fs');

var fhir2xml = require('fhir-json-to-xml');

var wrapper = require('../src/javascript-wrapper');
var createLm = require('../src/create-lm');

module.exports = wrapper(fhirToXmlFile);

function fhirToXmlFile( fhir, outdir ) {  

   if (_.isUndefined(fhir) || _.isUndefined(outdir) || _.isEmpty(outdir)) { 
       throw Error('Expected fhir data and an output directory in which to write the xml files!');
   }

   // console.log('\nenter fhir-to-xml with ', fhir);
   var fhirJsonToXml = new fhir2xml.FHIRConverter();
   var xmlFileNames;

   if ( _.isArray( fhir )) { 
           
      xmlFileNames = _.map( fhir, function( obj ) {
           // console.log('\nfhir to xml object to convert: ',obj,'\n');
           var obj2 = _.pick( obj, function(value, key, object) { 
               return ( key !== 'extension'  );
           }); 
           var fhirXml =  fhirJsonToXml.toXML( obj2 ); 
           var xmlFileName = outdir+'/fhir-'+createLm()+'.xml';
           // console.log('\nwrite file: ',xmlFileName,'\n');
           fs.writeFileSync(xmlFileName, fhirXml.toString());
           return xmlFileName; 
      }); 

   } else { 
       var obj = _.pick( fhir, function(value, key, object) { 
           return ( key !== 'extension' );
       }); 
      var fhirXml =  fhirJsonToXml.toXML( obj ); 
      var xmlFileName = outdir+'/fhir-'+createLm()+'.xml';
      // console.log('write file: ',xmlFileName);
      fs.writeFileSync(xmlFileName, fhirXml.toString());
      xmlFileNames = [ xmlFileName ];
   }

   return xmlFileNames; 
}
