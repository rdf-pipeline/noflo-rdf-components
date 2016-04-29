// chcs2fhir-demographics.js

var _ = require('underscore');

// NOTE: The rdftransforms are under a private git repository belonging to Hokukahu, LTD.  
// Please contact Hokukahu if you wish to run this component
var chcsFilter = require('../../rdftransforms/translate/chcs');
var translator = require('../../rdftransforms/translate/chcs2fhir_demographics');

var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper(patientDemographics);

/** 
 * Given patient CHCS data, extracts the patient demographics and translates
 * it to FHIR format.
 * 
 * @param chcs patient chcs data
 * 
 * @return the patient's demographic data in FHIR format
 */
function patientDemographics(chcs) {   

    if (_.isUndefined(chcs)) { 
        throw Error("PatientDemographics requires CHCS data input to translate!");
    }

    // Parse string json input (from IIP) if that's what we got 
    var patientChcs = (_.isString(chcs)) ? JSON.parse(chcs) : chcs;

    // Extract all patient CHCS demographic data from dataset
    var chcsDemographics = chcsFilter.extractDemographics(patientChcs);
    if (_.isEmpty(chcsDemographics)) {
        console.warn('No patient demographics found!');
        return {};
    }

    // If we have more than one patient in the dataset, return an array of the patient data
    if (chcsDemographics.length > 1) {
        return _.map( chcsDemographics, function(chcsDemographic) {
            // translate the demographic record from CHCS to FHIR
            return translator.translateDemographicsFhir(chcsDemographic);
        });
    } 
 
    // Just one patient in this dataset, so translate to FHIR & return as a single object
    return translator.translateDemographicsFhir(chcsDemographics[0]);
}
