// cmumps2fhir-procedures.js

var _ = require('underscore');

// NOTE: The rdftransforms are under a private git repository belonging to Hokukahu, LTD.  
// Please contact Hokukahu if you wish to run this component
var extractor = require('../../rdftransforms/translate/chcs');
var translator = require('../../rdftransforms/translate/chcs2fhir_procedures');

var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper(cmumps2fhirProcedures);

/** 
 * Extracts the patient procedures from a cmumps graph and translates it to FHIR format.
 * 
 * @param data cmumps patient data to be translated
 * 
 * @return an array of the patient's procedure data in FHIR format
 */
function cmumps2fhirProcedures(data) {   

    if (_.isUndefined(data)) {
        throw Error("PatientProcedures requires data to translate!");
    }

    // Parse string json input (from IIP) if that's what we got  
    var patientData = (_.isString(data)) ? JSON.parse(data) : data;

    // Extract all procedures from the dataset
    var procedures = extractor.extractProcedures(patientData);

    if (_.isEmpty(procedures)) {
       console.warn('No patient procedures found!');
       return [];
    }

    // How many procedures do we have?
    var numberOfProcs = (_.isArray(procedures)) ? procedures.length : 1;
    console.log('Number of Procedures: ',numberOfProcs);

    // Translate each procedure intoa FHIR procedure and return the array
    return _.map(procedures, function(procedure) {
        return translator.translateProceduresFhir(procedure);
    });
}  
