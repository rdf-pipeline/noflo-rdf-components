// cmumps2fhir-cmumpsProcedures.js

var _ = require('underscore');

var extractor = require('translators').cmumps;
var translator = require('translators').procedures;

var logger = require('../src/logger');
var cmumps2fhir = require('./cmumps2fhir');
var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper(cmumps2fhirProcedures);

/** 
 * Extracts the patient cmumpsProcedures from a cmumps graph and translates it to FHIR format.
 * 
 * @param data cmumps patient data to be translated
 * @param cmumps_file {string} output path for writing json intermediate file for cmumps data.
 *                             May be undefined.
 * @param fhir_file {string} output path for writing json intermediate file for fhir data.
 *                             May be undefined.
 * @return an array of the patient's procedure data in FHIR format
 */
function cmumps2fhirProcedures(data, cmumps_file, fhir_file) {

    logger.debug('Enter', {nodeInstance: this.nodeInstance});
    // console.log('data: ',util.inspect(data,{depth:null})+'\n');

    if (_.isUndefined(data)) {
        throw Error("Cmumps2fhir procedures component requires data to translate!");
    }

    var procedures = cmumps2fhir.call(this,
                                      data,
                                      extractor.extractProcedures,
                                      translator.translateProceduresFhir,
                                      cmumps_file,
                                      fhir_file);

    // How many procedures do we have?
    if (! _.isEmpty(procedures)) {
        var numberOfProcs = (_.isArray(procedures)) ? procedures.length : 1;
        logger.info('Number of Procedures: ',numberOfProcs);
    }

    return procedures;
}  
