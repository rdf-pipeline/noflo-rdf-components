// translate-procedure-chcs2fhir.js

var _ = require('underscore');

var translator = require('translators').procedures;
var chcs2fhir = require('./chcs2fhir');
var logger = require('../src/logger');
var wrapper = require('../src/translation-wrapper');

module.exports = wrapper({description: "Translates a CHCS procedure into FHIR",
                          icon: 'language',
                          isTranslator: true,
                          updater: translateProcedures});

/**
 * Given chcs patient procedure data, this updater translates it to FHIR format.
 * NOTE: This component differs from chcs2fhir-procedures in two important ways:
 *   1. This component works with the translation-wrapper, not the javascript-wrapper
 *   2. It works only with patient procedure data - it does not do extraction since
 *      that should have been done upstream by a component like patient-hash.js which
 *      generates the input required to work with the translation-wrapper.
 *
 * @param input {object} chcs patient procedure data to be translated
 * @param chcs_file {string} optional path for writing the demographics chcs data to file
 * @param fhir_file {string} optional path for writing the demographics fhir data to file
 *
 * @return the patient's procedure data in FHIR format
 */

function translateProcedures(input, chcs_file, fhir_file) {

    logger.debug('\nEnter ', {nodeInstance: this.nodeInstance});
    if (_.isUndefined(input)) {
        throw Error("No patient procedure data to translate!");
    }

    var procedure = chcs2fhir.call(this,
                                     input,
                                     undefined, // no extraction
                                     translator.translateProceduresFhir,
                                     chcs_file,
                                     fhir_file);

    return procedure;
}  
