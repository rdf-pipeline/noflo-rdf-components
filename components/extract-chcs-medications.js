/**
 * File: extract-chcs-medications.js
 */

var JSONPath = require('jsonpath-plus');

var chcs_types = require('../../rdftransforms/translate/chcs_types');

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
        return JSONPath(pattern(chcss.Medication), chcs);
    }  
});
