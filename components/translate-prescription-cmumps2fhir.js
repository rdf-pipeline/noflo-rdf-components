// translate-prescription-cmumps2fhir.js

var _ = require('underscore');
var util = require('util');

var translator = require('translators').prescriptions;

var cmumps2fhir = require('./cmumps2fhir');
var compHelper = require('../src/component-helper');
var logger = require('../src/logger');
var wrapper = require('../src/translation-wrapper');

module.exports = wrapper(translatePrescription);

/**
 * Given cmumps patient prescription data, this updater translates it to FHIR format.
 * NOTE: This component differs from cmumps2fhir-prescriptions in two important ways:
 *   1. This component works with the translation-wrapper, not the javascript-wrapper
 *   2. It works only with patient prescription data - it does not do extraction since
 *      that should have been done upstream by a component like patient-hash.js which
 *      generates the input required to work with the translation-wrapper.
 *
 * @param input {object} cmumps patient prescription data to be translated
 * @param cmumps_file {string} optional path for writing the demographics cmumps data to file
 * @param fhir_file {string} optional path for writing the demographics fhir data to file
 *
 * @return the patient's prescription data in FHIR format
 */
function translatePrescription(input, cmumps_file, fhir_file) {

    logger.debug('\nEnter ', {nodeInstance: this.nodeInstance});
    if (_.isUndefined(input)) {
        throw Error("No patient prescription data to translate!");
    }

    var prescription = cmumps2fhir(input,
                                   undefined, // no extraction 
                                   translator.translatePrescriptionsFhir,
                                   cmumps_file,
                                   fhir_file);

    return prescription;
}  
