// chcs2fhir-chcsProcedures.js

var _ = require('underscore');

var translator = require('translators').procedures;

var logger = require('../src/logger');
var chcs2fhir = require('./chcs2fhir');
var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper({description: "Extracts CHCS procedures from a dataset and translates them into FHIR",
                          icon: 'language',
                          updater: chcs2fhirProcedures});

/** 
 * Extracts the patient chcsProcedures from a chcs graph and translates it to FHIR format.
 * 
 * @param data chcs patient data to be translated
 * @param chcs_file {string} output path for writing json intermediate file for chcs data.
 *                             May be undefined.
 * @param fhir_file {string} output path for writing json intermediate file for fhir data.
 *                             May be undefined.
 * @return an array of the patient's procedure data in FHIR format
 */
function chcs2fhirProcedures(data, chcs_file, fhir_file) {

    logger.debug('Enter', {nodeInstance: this.nodeInstance});
    // console.log('data: ',util.inspect(data,{depth:null})+'\n');

    if (_.isUndefined(data)) {
        throw Error("Chcs2fhir procedures component requires data to translate!");
    }

    var procedures = chcs2fhir.call(this,
                                      data,
                                      translator.extractProcedures,
                                      translator.translateProceduresFhir,
                                      chcs_file,
                                      fhir_file);

    // How many procedures do we have?
    if (! _.isEmpty(procedures)) {
        var numberOfProcs = (_.isArray(procedures)) ? procedures.length : 1;
        logger.info('Number of Procedures: ',numberOfProcs);
    }

    return procedures;
}  
