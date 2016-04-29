// chcs2fhir-prescriptions.js

var _ = require('underscore');

// NOTE: The rdftransforms are under a private git repository belonging to Hokukahu, LTD.  
// Please contact Hokukahu if you wish to run this component
var chcsFilter = require('../../rdftransforms/translate/chcs');
var translator = require('../../rdftransforms/translate/chcs2fhir_prescriptions');

var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper(chcs2fhirPrescriptions);

/** 
 * Extracts the patient medications from a CHCS graph and translates it to FHIR format.
 * 
 * @param chcs patient CHCS dataset to be processed
 * 
 * @return an array of the patient's medications in FHIR format
 */
function chcs2fhirPrescriptions(chcs) {   

    if (_.isUndefined(chcs)) {
        throw Error("PatientPrescriptions requires CHCS data input to translate!");
    }

    // Parse string json input (from IIP) if that's what we got  
    var patientChcs = (_.isString(chcs)) ? JSON.parse(chcs) : chcs;

    // Extract all medications from the dataset
    var chcsMeds = chcsFilter.extractMedications(patientChcs);

    // Got any medications in this CHCS dataset?
    if (_.isEmpty(chcsMeds)) {
        console.warn('No patient medications found!');
        return [];
    }

    // How many meds do we have?  
    var numberOfMeds = (_.isArray(chcsMeds)) ? chcsMeds.length : 1;
    console.log('Number of Prescriptions: ',numberOfMeds);

    // Translate each CHCS medicine into a FHIR prescription and return the array 
    // of translated prescription records
    return _.map(chcsMeds, function(prescription) {
        return translator.translatePrescriptionsFhir(prescription);
    });
}  
