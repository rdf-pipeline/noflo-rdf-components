// cmumps2fhir-demographics.js

var _ = require('underscore');

// NOTE: The rdftransforms are under a private git repository belonging to Hokukahu, LTD.  
// Please contact Hokukahu if you wish to run this component
var extractor = require('../../rdftransforms/translate/chcs');
var translator = require('../../rdftransforms/translate/chcs2fhir_demographics');

var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper(patientDemographics);

/** 
 * Given patient data, extracts the patient demographics and translates
 * it to FHIR format.
 * 
 * @param data cmumps patient data to be translated
 * 
 * @return the patient's demographic data in FHIR format
 */
function patientDemographics(data) {   

    if (_.isUndefined(data)) { 
        throw Error("PatientDemographics requires data to translate!");
    }

    // Parse string json input (from IIP) if that's what we got 
    var patientData = (_.isString(data)) ? JSON.parse(data) : data;

    // Extract all patient demographic data from dataset
    var demographics = extractor.extractDemographics(patientData);
    if (_.isEmpty(demographics)) {
        console.warn('No patient demographics found!');
        return {};
    }

    // If we have more than one patient in the dataset, return an array of the patient data
    if (demographics.length > 1) {
        return _.map(demographics, function(demographic) {
            // translate the demographic record to FHIR
            return translator.translateDemographicsFhir(demographic);
        });
    } 
 
    // Just one patient in this dataset, so translate to FHIR & return as a single object
    return translator.translateDemographicsFhir(demographics[0]);
}
