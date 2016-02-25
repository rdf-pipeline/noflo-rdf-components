/**
 * File:  patient-medications-chcs2fhir.js
 */

var _ = require('underscore');

var jswrapper = require('../src/javascript-wrapper');
var translate = require('../../rdftransforms/translate/chcs2fhir.js');

exports.getComponent = jswrapper({

    name: "patient-medications-chcs2fhir",
    description: "translates a CHCS patient record with medications to FHIR.",

    inPorts: { 
        medications: { 
            datatype: 'object',
            description: "a JSON object with CHCS patient medications data to be converted to FHIR",
            required: true
        }
    },

    updater: function( medications ) {  

       try {

           var fhirMedsTranslations = medications.map(translate.translate_medication_fhir);
           return _.pluck( fhirMedsTranslations, 'fhir');

       } catch (e) {
           console.log('Translation exception: '+e.message);
           throw new Error("Unable to translate CHCS patient medications record: ",e);
       }

    }
});
