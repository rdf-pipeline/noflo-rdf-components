/**
 * File:  patient-demographics-chcs2fhir.js
 */

var _ = require('underscore');

var jswrapper = require('../src/javascript-wrapper');
var translate = require('../../rdftransforms/translate/chcs2fhir.js');

exports.getComponent = jswrapper({

    name: "patient-demographics-chcs2fhir",
    description: "translates a CHCS patient record with medications to FHIR.",

    inPorts: { 
        patient: { 
            datatype: 'object',
            description: "a JSON object with CHCS patient demographics data to be converted to FHIR",
            required: true
        }
    },

    updater: function( patient ) {  

       console.log('enter patient-demographics-chcs2fhir updater');
       try {

           var fhir_demographics_translation = 
                 translate.translate_demographics_fhir_jp(patient);
           return fhir_demographics_translation.fhir;

       } catch (e) {
           console.log('Translation exception: '+e.message);
           throw new Error("Unable to translate CHCS patient record: ",e);
       }

    }
});
