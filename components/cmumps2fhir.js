// cmumps2fhir.js
// Helper for the cmums2fhir-* components since the logic is similar for all of them.

var _ = require('underscore');
var fs = require('fs');
var util = require('util');

var extractor = require('translators').cmumps;

/** 
 * Given some cmumps patient data, this helper extracts the piece of interest (e.g, demographics),  
 * translates it to FHIR, and returns it.
 * 
 * @param data cmumps patient data to be translated
 * @param extractor the function for extracting the cmumps data of interest
 * @param translator the function for cmumps to fhir translation
 * @param cmumpsFile  output path for writing json intermediate file for cmumps data
 * @param fhirFile output path for writing json intermediate file for fhir data
 * 
 * @return the patient's data in FHIR format
 */
module.exports = function(data, extractor, translator, cmumpsFile, fhirFile) { 

    if (_.isUndefined(data)) { 
        throw Error("Cmumps2fhir requires data to translate!");
    }

    // Parse string json input (from IIP) if that's what we got 
    var patientData = _.isString(data) ? JSON.parse(data) : data;

    // Extract all patient demographic data from dataset
    var cmumpsData = _.isUndefined(extractor) ? patientData: extractor(patientData);

    // Write intermediate cmumps json file for debug purposes
    writeFile(cmumpsFile, cmumpsData);

    if (_.isEmpty(cmumpsData)) {
        // This may be normal in some cases, so log a warning in case it's not, and return 
        console.warn('No patient cmumps data found!');
        return;
    }

    var fhirData;
    if (_.isArray(cmumpsData)) { 
        fhirData = _.map(cmumpsData, function(cmumpsDatum) {
            return _.isUndefined(translator) ? cmumpsDatum : translator(cmumpsDatum);
        })
    } else {
        fhirData = _.isUndefined(translator) ? cmumpsData : translator(cmumpsData);
    }

    // Write intermediate fhir json file for debug purposes
    writeFile(fhirFile, fhirData);

    if (_.isEmpty(fhirData)) {
        // This may be normal in some cases, so just log a warning we got nothing, and return 
        console.warn('No patient cmumps data translated to fhir!');
    }

    return fhirData;
}

function writeFile(fileName, data) {
    if (! _.isEmpty(fileName)) {
        fs.writeFileSync(fileName, util.inspect(data, {depth:null}));
        console.log('Wrote',fileName);
    }
}
