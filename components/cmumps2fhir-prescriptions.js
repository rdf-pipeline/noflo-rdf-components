// cmumps2fhir-prescriptions.js

var _ = require('underscore');
var util = require('util');

var extractor = require('translators').cmumps;
var translator = require('translators').prescriptions;

var logger = require('../src/logger');
var cmumps2fhir = require('./cmumps2fhir');
var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper(cmumps2fhirPrescriptions);

/** 
 * Extracts the patient medications from a cmumps graph and translates it to FHIR format.
 * 
 * @param data {object} cmumps patient data to be translated
 * @param cmumps_file {string} output path for writing json intermediate file for cmumps data.
 *                             May be undefined.
 * @param fhir_file {string} output path for writing json intermediate file for fhir data.
 *                             May be undefined.
 * 
 * @return an array of the patient's medications in FHIR format
 */
function cmumps2fhirPrescriptions(data, cmumps_file, fhir_file) {
    logger.debug('Enter', {nodeInstance: this.nodeInstance});
        // console.log('data: ',util.inspect(data,{depth:null})+'\n');

    if (_.isUndefined(data)) {
        throw Error("Cmumps2fhir prescriptions component requires data to translate!");
    }

    var prescriptions = cmumps2fhir.call(this,
                                         data,
                                         extractor.extractMedications,
                                         translator.translatePrescriptionsFhir,
                                         cmumps_file,
                                         fhir_file);

    // How many prescriptions do we have?  
    if (! _.isEmpty(prescriptions)) {
        var numberOfMeds = (_.isArray(prescriptions)) ? prescriptions.length : 1;
        logger.info('Number of Prescriptions: ',numberOfMeds+'\n');
    }

    return prescriptions;
}  
