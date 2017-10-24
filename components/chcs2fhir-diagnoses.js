// chcs2fhir-diagnoses.js

var _ = require('underscore');

var logger = require('../src/logger');
var translator = require('translators').diagnoses;

var chcs2fhir = require('./chcs2fhir');
var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper({description: "Extracts CHCS diagnoses from a dataset and translates them into FHIR",
                          icon: 'language',
                          updater: chcs2fhirDiagnoses});

/** 
 * Extracts the patient diagnoses from a chcs graph and translates it to FHIR format.
 * 
 * @param data {object} chcs patient data to be translated
 * @param chcs_file {string} output path for writing json intermediate file for chcs data.
 *                             May be undefined.
 * @param fhir_file {string} output path for writing json intermediate file for fhir data.
 *                             May be undefined.
 * 
 * @return an array of the patient's diagnoses in FHIR format
 */
function chcs2fhirDiagnoses(data, chcs_file, fhir_file) {

    if (_.isUndefined(data)) {
        throw Error("Chcs2fhir diagnoses component requires data to translate!");
    }

    var diagnoses = chcs2fhir.call(this,
                                     data, 
                                     translator.extractDiagnoses,
                                     translator.translateDiagnosesFhir,
                                     chcs_file,
                                     fhir_file);

    // How many diagnoses do we have?  
    if (! _.isEmpty(diagnoses)) {
        var numberOfDiagnoses = (_.isArray(diagnoses)) ? diagnoses.length : 1;
        logger.info('Number of Diagnoses: ',numberOfDiagnoses);
    }

    return diagnoses;
}  
