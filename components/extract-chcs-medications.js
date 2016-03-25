/**
 * File: extract-chcs-medications.js
 */

var JSONPath = require('jsonpath-plus');

var fs = require('fs');
var util = require('util');
var chcsAll = require('../../rdftransforms/translate/chcs2fhir_all');
var fhir = require('../../rdftransforms/translate/fhir');

var jswrapper = require('../src/javascript-wrapper');

exports.getComponent = jswrapper({

    name: "extract-chcs-medications",
    description: "extracts the patient medications data from a CHCS graph",

    inPorts: { 
        chcs: { 
            datatype: 'object',
            description: "the CHCS graph to be filtered to extract patient medication data",
            required: true
        }
    },

    /** 
     * Extracts the patient medications from a CHCS graph 
     * 
     * @param chcs graph to be processed
     * 
     * @return a medications array
     */
    updater: function( chcs ) {   

        var result = chcsAll.translateChcsFhir(chcs);
        var meds = fhir.extractMedications( result ); 
console.log('\nmeds: ',meds);
        return meds;
    }  
});
