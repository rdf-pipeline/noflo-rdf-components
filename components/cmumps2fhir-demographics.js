// cmumps2fhir-demographics.js

var _ = require('underscore');
var fs = require('fs');
var util = require('util');

// NOTE: The rdftransforms are under a private git repository belonging to Hokukahu, LTD.  
// Please contact Hokukahu if you wish to run this component
var extractor = require('rdftransforms').cmumps;
var translator = require('rdftransforms').demographics;

var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper(patientDemographics);

/** 
 * Given patient data, extracts the patient demographics and translates
 * it to FHIR format.
 * 
 * @param data cmumps patient data to be translated
 * @param outdir output directory for json intermediate files
 * 
 * @return the patient's demographic data in FHIR format
 */
function patientDemographics(data, outdir) {   

    var cmumpsDemographics;
    var fhirDemographics;
    var filename;

    if (_.isUndefined(data)) { 
        throw Error("PatientDemographics requires data to translate!");
    }

    // Parse string json input (from IIP) if that's what we got 
    var patientData = (_.isString(data)) ? JSON.parse(data) : data;

    // Extract all patient demographic data from dataset
    var cmumpsDemographics = extractor.extractDemographics(patientData);

    // Write intermediate cmumps json file for debug purposes
    filename = outdir+'CmumpsDemographics.json';
    fs.writeFileSync(filename, util.inspect(cmumpsDemographics, {depth:null}));
    console.log('Wrote',filename);

    if (_.isEmpty(cmumpsDemographics)) {
        console.warn('No patient demographics found!');
        return {};
    }

    // If we have more than one patient in the dataset, return an array of the patient data
    if (cmumpsDemographics.length > 1) {
        fhirDemographics = _.map(cmumpDemographics, function(cmumpsDemographic) {
            // translate the demographic record to FHIR
            return translator.translateDemographicsFhir(cmumpsDemographic);
        });
    } else { 
        // Just one patient in this dataset, so translate to FHIR & return as a single object
        fhirDemographics = translator.translateDemographicsFhir(cmumpsDemographics[0]);
    }

    // Write intermediate fhir json file for debug purposes
    filename = outdir+'FhirDemographics.json';
    fs.writeFileSync(filename, util.inspect(fhirDemographics, {depth:null}));
    console.log('Wrote',filename);

    return fhirDemographics;
}
