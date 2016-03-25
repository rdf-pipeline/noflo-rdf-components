/**
 * File: extract-chcs-patients.js
 */

var jswrapper = require('../src/javascript-wrapper');

var chcsAll = require('../../rdftransforms/translate/chcs2fhir_all');
var fhir = require('../../rdftransforms/translate/fhir');

exports.getComponent = jswrapper({

    name: "extract-chcs-patients",
    description: "extracts the patient data from a CHCS graph",

    inPorts: { 
        chcs: { 
            datatype: 'object',
            description: "the CHCS graph to be filtered to extract patient data",
            required: true
        }
    },

    /** 
     * Extracts the patient data from a CHCS graph 
     * 
     * @param chcs graph to be processed
     * 
     * @return a single patient object if just one patient, or 
     *         an array of patients data if more than one patient
     */
    updater: function( chcs ) {   

        console.log('enter extrac-chcs-patients');
        var result = chcsAll.translateChcsFhir(chcs);
        var patients = fhir.extractPatient( result );

        console.log('\nextract-chcs-patients returning: ', patients,'\n' );
        return patients; // return the whole array
    }  
});
