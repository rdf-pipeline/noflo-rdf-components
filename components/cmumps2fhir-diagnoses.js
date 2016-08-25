// cmumps2fhir-diagnoses.js

var _ = require('underscore');

var extractor = require('translators').cmumps;
var translator = require('translators').diagnoses;

var cmumps2fhir = require('./cmumps2fhir');
var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper({description: "Extracts CMUMPS diagnoses from a dataset and translates them into FHIR",
                          icon: 'language',
                          updater: cmumps2fhirDiagnoses});

/** 
 * Extracts the patient diagnoses from a cmumps graph and translates it to FHIR format.
 * 
 * @param data {object} cmumps patient data to be translated
 * @param cmumps_file {string} output path for writing json intermediate file for cmumps data.
 *                             May be undefined.
 * @param fhir_file {string} output path for writing json intermediate file for fhir data.
 *                             May be undefined.
 * 
 * @return an array of the patient's diagnoses in FHIR format
 */
function cmumps2fhirDiagnoses(data, cmumps_file, fhir_file) {

    if (_.isUndefined(data)) {
        throw Error("Cmumps2fhir diagnoses component requires data to translate!");
    }

    var diagnoses = cmumps2fhir.call(this,
                                     data, 
                                     extractor.extractDiagnoses,
                                     translator.translateDiagnosesFhir,
                                     cmumps_file,
                                     fhir_file);

    // How many diagnoses do we have?  
    if (! _.isEmpty(diagnoses)) {
        var numberOfDiagnoses = (_.isArray(diagnoses)) ? diagnoses.length : 1;
        console.log('Number of Diagnoses: ',numberOfDiagnoses);
    }

    return diagnoses;
}  
