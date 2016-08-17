// fhir-json-to-xml.js

var _ = require('underscore');
var fs = require('fs');
var util = require('util');

var fhir2xml = require('fhir-json-to-xml');

var logger = require('../src/logger');
var createLm = require('../src/create-lm');
var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper({isTransient: true,
                          updater: fhirJsonToXmlFile});


/**
 * Given a fhir object with one or more records, converts it to XML and writes each 
 * record to its own XML file
 * 
 * @param fhir fhir input as a javascript object
 * @param outdir file system path where the xml file(s) should be written
 * 
 * @return a list of the xml files that were written
 */
function fhirJsonToXmlFile(fhir, outdir) {  

    logger.debug('Enter', {nodeInstance: this.nodeInstance});
        // console.log('fhir: ',util.inspect(fhir,{depth:null})+'\n');

   if (_.isUndefined(fhir) || _.isUndefined(outdir) || _.isEmpty(outdir)) { 
       throw Error('Expected fhir data and an output directory in which to write the xml files!');
   }

   var xmlFileNames;
   var fhirJsonToXml = new fhir2xml.FHIRConverter();

   // Do we have one fhir object, or an array of them? 
   // Translator cannot handle arrays - we need to process them one at a time
   if (_.isArray(fhir)) { 
           
      // Create one xml file per fhir object and get that list of file names
      xmlFileNames = _.map(fhir, function(fhirObject) {
 
           // Get all attributes from the object EXCEPT the extension attributes
           // The translator does not current support extension.
           var cleanFhir = filterAttribute(fhirObject, 'extension');

           // convert the object to xml, write to a file, and return the file name
           var filename = xmlFileName(outdir, fhirObject);
           fs.writeFileSync(filename, fhirJsonToXml.toXML(cleanFhir).toString()); 
           return filename;
      }); 

   } else { 
       // Get all attributes from the object EXCEPT the extension attributes
       // The translator does not current support extension.
       var cleanFhir = filterAttribute(fhir, 'extension');

       // convert the fhir object to xml, write to a file, and return the file name
       var filename = xmlFileName(outdir, fhir);
       fs.writeFileSync(filename, fhirJsonToXml.toXML(cleanFhir).toString()); 
       xmlFileNames = [filename];
   } 

   // console.log('FHIR JSON to XML returning ',xmlFileNames,'\n');
   return xmlFileNames; 
}

/** 
 * Filter out the specified attribute from a javascript object.
 *
 * @param object 
 * @param attribute
 * 
 * @return the object minus the filtered attribute
 */
function filterAttribute(object, attributeName) {
    return _.pick(object, function(value, key) { 
               return (key !== attributeName);
    });  
}

/**
 * Writes a fhir object to an xml file
 * 
 * @param outdir output directory path
 * @param fhir fhir object to be written
 */
function xmlFileName(outdir, fhir) { 
    var resourceType = fhir.resourceType +':' || '';
    var resourceId = fhir.id + '-' || '';

    var filename = outdir + 'fhir-' + resourceType + resourceId + createLm() + '.xml';

    logger.debug('writing to file', {xmlFileName: filename, nodeInstance: this.nodeInstance});
    return filename; 
}
