/**
 * File: extract-chcs-patients.js
 */

var jswrapper = require('../src/javascript-wrapper');

var chcsAll = require('../../rdftransforms/translate/chcs2fhir_all');
var fhir = require('../../rdftransforms/translate/fhir');

exports.getComponent = jswrapper({

    name: "extract-diagnoses",
    description: "extracts the patient diagnoses from a CHCS graph",

    inPorts: { 
        chcs: { 
            datatype: 'object',
            description: "the CHCS graph to be filtered to extract patient diagnoses data",
            required: true
        }
    },

    /** 
     * Extracts the patient diagnoses from a CHCS graph 
     * 
     * @param chcs graph to be processed
     * 
     * @return an array of diagnosis data for the patient
     */
    updater: function( chcs ) {   

        var result = chcsAll.translateChcsFhir(chcs);
        var diagnoses = fhir.extractDiagnoses( result );
        console.log('diagnoses: ',diagnoses);
        return diagnoses;  // array of FHIR diagnoses
    }  
});
