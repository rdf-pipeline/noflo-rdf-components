// translate-diagnosis-cmumps2fhir.js

var _ = require('underscore');
var util = require('util');

var translator = require('translators').diagnoses;

var cmumps2fhir = require('./cmumps2fhir');
var logger = require('../src/logger');
var wrapper = require('../src/translation-wrapper');

module.exports = wrapper({isTranslator: true,
                          isTransient: true,
                          updater: translateDiagnosis});

/**
 * Given a cmumps patient diagnosis, this updater translates it to FHIR format.
 * NOTE: This component differs from cmumps2fhir-diagnosess in two important ways:
 *   1. This component works with the translation-wrapper, not the javascript-wrapper
 *   2. It works only with patient diagnosis data - it does not do extraction since
 *      that should have been done upstream by a component like patient-hash.js which
 *      generates the input required to work with the translation-wrapper.
 *
 * @param input {object} cmumps patient diagnosis data to be translated
 * @param cmumps_file {string} optional path for writing the diagnosis cmumps data to file
 * @param fhir_file {string} optional path for writing the diagnosis fhir data to file
 *
 * @return the patient's diagnosis data in FHIR format
 */
function translateDiagnosis(input, cmumps_file, fhir_file) {

    logger.debug('\nEnter ', {nodeInstance: this.nodeInstance});
    if (_.isUndefined(input)) {
        throw Error("No patient diagnosis data to translate!");
    }

    var diagnosis = cmumps2fhir.call(this,
                                        input,
                                        undefined, // no extraction 
                                        translator.translateDiagnosesFhir,
                                        cmumps_file,
                                        fhir_file);
    return diagnosis;
}  