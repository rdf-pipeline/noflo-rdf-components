// cmumps2fhir-prescriptions.js

var _ = require('underscore');

// NOTE: The rdftransforms are under a private git repository belonging to Hokukahu, LTD.
// Please contact Hokukahu if you wish to run this component
var extractor = require('../../rdftransforms/translate/chcs');
var translator = require('../../rdftransforms/translate/chcs2fhir_prescriptions');

var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper(cmumps2fhirPrescriptions);

/** 
 * Extracts the patient medications from a cmumps graph and translates it to FHIR format.
 * 
 * @param data cmumps patient data to be translated
 * 
 * @return an array of the patient's medications in FHIR format
 */
function cmumps2fhirPrescriptions(data) {   

    if (_.isUndefined(data)) {
        throw Error("PatientPrescriptions requires data to translate!");
    }

    // Parse string json input (from IIP) if that's what we got  
    var patientData = (_.isString(data)) ? JSON.parse(data) : data;

    // Extract all medications from the dataset
    var meds = extractor.extractMedications(patientData);

    if (_.isEmpty(meds)) {
        console.warn('No patient medications found!');
        return [];
    }

    // How many meds do we have?  
    var numberOfMeds = (_.isArray(meds)) ? meds.length : 1;
    console.log('Number of Prescriptions: ',numberOfMeds);

    // Translate each medicine into a FHIR prescription and return the array 
    // of translated prescription records
    return _.map(meds, function(prescription) {
        return translator.translatePrescriptionsFhir(prescription);
    });
}  
