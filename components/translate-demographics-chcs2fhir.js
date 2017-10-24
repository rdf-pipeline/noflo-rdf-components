// translate-demographics-chcs2fhir.js

var _ = require('underscore');
var util = require('util');

var translator = require('translators').demographics;
var chcs2fhir = require('./chcs2fhir');
var logger = require('../src/logger');
var wrapper = require('../src/translation-wrapper');

module.exports = wrapper({description: "Translates a CHCS demographic record into FHIR",
                          icon: 'language',
                          isTranslator: true, 
                          updater: translateDemographics});

/** 
 * Given chcs patient demographic data, this updater translates it to FHIR format.
 * NOTE: This component differs from chcs2fhir-demographics in two important ways: 
 *   1. This component works with the translation-wrapper, not the javascript-wrapper
 *   2. It works only with patient demographics data - it does not do extraction since
 *      that should have been done upstream by a component like patient-hash.js which
 *      generates the input required to work with the translation-wrapper.
 * 
 * @param input {object} chcs patient demographic data to be translated
 * @param chcs_file {string} optional path for writing the demographics chcs data to file
 * @param fhir_file {string} optional path for writing the demographics fhir data to file
 * 
 * @return the patient's demographic data in FHIR format
 */
function translateDemographics(input, chcs_file, fhir_file) {

    logger.debug('\nEnter ', {nodeInstance: this.nodeInstance});
    if (_.isUndefined(input)) { 
        throw Error("No patient demographics data to translate!");
    }

    var demographics = chcs2fhir.call(this,
                                        input,  
                                        undefined,  // no extraction required 
                                        translator.translateDemographicsFhir,
                                        chcs_file, 
                                        fhir_file);

    logger.debug('Translated demographics:\n',util.inspect(demographics, {depth:null}));
    return demographics;
}
