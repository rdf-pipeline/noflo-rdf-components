// cmumps2fhir-prescriptions.js

var _ = require('underscore');
var fs = require('fs');
var util = require('util');

// NOTE: The rdftransforms are under a private git repository belonging to Hokukahu, LTD.
// Please contact Hokukahu if you wish to run this component
var extractor = require('rdftransforms').cmumps;
var translator = require('rdftransforms').prescriptions;

var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper(cmumps2fhirPrescriptions);

/** 
 * Extracts the patient medications from a cmumps graph and translates it to FHIR format.
 * 
 * @param data cmumps patient data to be translated
 * @param outdir output directory for json intermediate files
 * 
 * @return an array of the patient's medications in FHIR format
 */
function cmumps2fhirPrescriptions(data, outdir) {   

    var cmumpsPrescriptions;
    var fhirPrescriptions;
    var filename;

    if (_.isUndefined(data)) {
        throw Error("PatientPrescriptions requires data to translate!");
    }

    // Parse string json input (from IIP) if that's what we got  
    var patientData = (_.isString(data)) ? JSON.parse(data) : data;

    // Extract all medications from the dataset
    var cmumpsPrescriptions = extractor.extractMedications(patientData);

    // Write intermediate cmumps json file for debug purposes
    filename = outdir+'CmumpsPrescriptions.json';
    fs.writeFileSync(filename, util.inspect(cmumpsPrescriptions, {depth:null}));
    console.log('Wrote',filename);

    if (_.isEmpty(cmumpsPrescriptions)) {
        console.warn('No patient medications found!');
        return [];
    }

    // How many cmumpsPrescriptions do we have?  
    var numberOfMeds = (_.isArray(cmumpsPrescriptions)) ? cmumpsPrescriptions.length : 1;
    console.log('Number of Prescriptions: ',numberOfMeds);

    // Translate each medicine into a FHIR prescription and return the array 
    // of translated prescription records
    fhirPrescriptions = _.map(cmumpsPrescriptions, function(cmumpsPrescription) {
        return translator.translatePrescriptionsFhir(cmumpsPrescription);
    });

    // Write intermediate fhir json file for debug purposes
    filename = outdir+'FhirPrescriptions.json';
    fs.writeFileSync(filename, util.inspect(fhirPrescriptions, {depth:null}));
    console.log('Wrote',filename);

    return fhirPrescriptions;
}  
