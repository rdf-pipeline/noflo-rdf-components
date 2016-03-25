/**
 * File: extract-chcs-labs.js
 */

var util = require('util');
var jswrapper = require('../src/javascript-wrapper');

var chcsAll = require('../../rdftransforms/translate/chcs2fhir_all');
var fhir = require('../../rdftransforms/translate/fhir');

exports.getComponent = jswrapper({

    name: "extract-chcs-labs",
    description: "extracts the lab data from a CHCS graph",

    inPorts: { 
        chcs: { 
            datatype: 'object',
            description: "the CHCS graph to be filtered to extract lab data",
            required: true
        }
    },

    /** 
     * Extracts the lab data from a CHCS graph 
     * 
     * @param chcs graph to be processed
     * 
     * @return a single lab object if just one lab, or 
     *         an array of labs data if more than one lab
     */
    updater: function( chcs ) {   

        console.log('\nenter extract-chcs-labs with chcs: ', chcs);
        var result = chcsAll.translateChcsFhir(chcs);
console.log('\nresult=',util.inspect( result, { depth: null } ) );
        var labs = fhir.extractLabs( result );

        console.log('\nextract-chcs-labs returning: ', labs,'\n' );
        return labs; // return the whole array
    }  
});
