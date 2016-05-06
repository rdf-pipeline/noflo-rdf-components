// cmumps2fhir-cmumpsProcedures.js

var _ = require('underscore');
var fs = require('fs');
var util = require('util');

// NOTE: The rdftransforms are under a private git repository belonging to Hokukahu, LTD.  
// Please contact Hokukahu if you wish to run this component
var extractor = require('rdftransforms').cmumps;
var translator = require('rdftransforms').procedures;

var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper(cmumps2fhirProcedures);

/** 
 * Extracts the patient cmumpsProcedures from a cmumps graph and translates it to FHIR format.
 * 
 * @param data cmumps patient data to be translated
 * 
 * @return an array of the patient's procedure data in FHIR format
 */
function cmumps2fhirProcedures(data, outdir) {   

    var cmumpsProcedures;
    var fhirProcedures;
    var filename;

    if (_.isUndefined(data)) {
        throw Error("PatientProcedures requires data to translate!");
    }

    // Parse string json input (from IIP) if that's what we got  
    var patientData = (_.isString(data)) ? JSON.parse(data) : data;

    // Extract all cmumpsProcedures from the dataset
    var cmumpsProcedures = extractor.extractProcedures(patientData);

    // Write intermediate cmumps json file for debug purposes
    filename = outdir+'CmumpsProcedures.json';
    fs.writeFileSync(filename, util.inspect(cmumpsProcedures, {depth:null}));
    console.log('Wrote',filename);

    if (_.isEmpty(cmumpsProcedures)) {
       console.warn('No patient cmumpsProcedures found!');
       return [];
    }

    // How many cmumpsProcedures do we have?
    var numberOfProcs = (_.isArray(cmumpsProcedures)) ? cmumpsProcedures.length : 1;
    console.log('Number of Procedures: ',numberOfProcs);

    // Translate each procedure intoa FHIR procedure and return the array
    var fhirProcedures = _.map(cmumpsProcedures, function(cmumpsProcedure) {
        return translator.translateProceduresFhir(cmumpsProcedure);
    });

    // Write intermediate fhir json file for debug purposes
    filename = outdir+'FhirProcedures.json';
    fs.writeFileSync(filename, util.inspect(fhirProcedures, {depth:null}));
    console.log('Wrote',filename);

    return fhirProcedures;
}  
