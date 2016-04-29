// chcs2fhir-procedures.js

var _ = require('underscore');

// NOTE: The rdftransforms are under a private git repository belonging to Hokukahu, LTD.  
// Please contact Hokukahu if you wish to run this component
var chcsFilter = require('../../rdftransforms/translate/chcs');
var translator = require('../../rdftransforms/translate/chcs2fhir_procedures');

var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper(chcs2fhirProcedures);

/** 
 * Extracts the patient procedures from a CHCS graph and translates it to FHIR format.
 * 
 * @param chcs patient CHCS dataset to be processed
 * 
 * @return an array of the patient's procedure data in FHIR format
 */
function chcs2fhirProcedures(chcs) {   

    if (_.isUndefined(chcs)) {
        throw Error("PatientProcedures requires CHCS data input to translate!");
    }

    // Parse string json input (from IIP) if that's what we got  
    var patientChcs = (_.isString(chcs)) ? JSON.parse(chcs) : chcs;

    // Extract all procedures from the CHCS dataset
    var chcsProcedures = chcsFilter.extractProcedures(patientChcs);

    // Got any procedures in this CHCS data set?
    if (_.isEmpty(chcsProcedures)) {
       console.warn('No patient procedures found!');
       return [];
    }

    // How many procedures do we have?
    var numberOfProcs = (_.isArray(chcsProcedures)) ? chcsProcedures.length : 1;
    console.log('Number of Procedures: ',numberOfProcs);

    // Translate each procedure intoa FHIR procedure and return the array
    return _.map(chcsProcedures, function(chcsProcedure) {
        return translator.translateProceduresFhir(chcsProcedure);
    });
}  
