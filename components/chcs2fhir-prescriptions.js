// chcs2fhir-prescriptions.js

var _ = require('underscore');
var util = require('util');

var translator = require('translators').prescriptions;

var logger = require('../src/logger');
var chcs2fhir = require('./chcs2fhir');
var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper({description: "Extracts CHCS prescriptions from a dataset and translates them into FHIR",
                          icon: 'language',
                          updater: chcs2fhirPrescriptions});

/** 
 * Extracts the patient medications from a chcs graph and translates it to FHIR format.
 * 
 * @param data {object} chcs patient data to be translated
 * @param chcs_file {string} output path for writing json intermediate file for chcs data.
 *                             May be undefined.
 * @param fhir_file {string} output path for writing json intermediate file for fhir data.
 *                             May be undefined.
 * 
 * @return an array of the patient's medications in FHIR format
 */
function chcs2fhirPrescriptions(data, chcs_file, fhir_file) {
    logger.debug('Enter', {nodeInstance: this.nodeInstance});
        // console.log('data: ',util.inspect(data,{depth:null})+'\n');

    if (_.isUndefined(data)) {
        throw Error("Chcs2fhir prescriptions component requires data to translate!");
    }

    var prescriptions = chcs2fhir.call(this,
                                         data,
                                         translator.extractMedications,
                                         translator.translatePrescriptionsFhir,
                                         chcs_file,
                                         fhir_file);

    // How many prescriptions do we have?  
    if (! _.isEmpty(prescriptions)) {
        var numberOfMeds = (_.isArray(prescriptions)) ? prescriptions.length : 1;
        logger.info('Number of Prescriptions: ',numberOfMeds+'\n');
    }

    return prescriptions;
}  
