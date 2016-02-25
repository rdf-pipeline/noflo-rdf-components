/**
 * File: extract-chcs-patients.js
 */

var JSONPath = require('jsonpath-plus');

var chcs_types = require('../../rdftransforms/translate/chcs_types');

var jswrapper = require('../src/javascript-wrapper');

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

        var graph = chcs["@graph"];
        var pattern = chcs_types.chcss_json_pattern;
        var chcss = chcs_types.chcss;
        var patients = JSONPath(pattern(chcss.Person), chcs);

        if ( patients.length === 1 ) { 
           // Return just a single patient object.  We need this for the demo.
           // Should probably remove this in the future
           return patients[0];
        } 

        return patients; // return the whole array
    }  
});
