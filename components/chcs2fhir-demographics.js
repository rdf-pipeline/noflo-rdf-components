// chcs2fhir-demographics.js

var _ = require('underscore');
var util = require('util');

var translator = require('translators').demographics;

var chcs2fhir = require('./chcs2fhir');
var logger = require('../src/logger');
var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper({description: "Extracts a CHCS demographic record from a dataset and translates it into FHIR",
                          icon: 'language',
                          updater: patientDemographics});

/** 
 * Given patient data, extracts the patient demographics and translates
 * it to FHIR format.
 * 
 * @param data chcs {object} patient data to be translated
 * @param chcs_file {string} output path for writing json intermediate file for chcs data.
 *                             May be undefined.
 * @param fhir_file {string} output path for writing json intermediate file for fhir data.
 *                             May be undefined.
 * 
 * @return the patient's demographic data in FHIR format
 */
function patientDemographics(data, chcs_file, fhir_file) {   

    logger.debug('Enter', {nodeInstance: this.nodeInstance});
    // console.log('data: ',util.inspect(data,{depth:null})+'\n');

    if (_.isUndefined(data)) { 
        throw Error("Chcs2fhir demographics component requires data to translate!");
    }

    var translation = chcs2fhir.call(this,
                                       data,  
                                       translator.extractPatient, 
                                       translator.translateDemographicsFhir,
                                       chcs_file,
                                       fhir_file);

    return (_.isArray(translation) && translation.length === 1) ? translation[0] : translation;
}
