// cmumps2fhir-demographics.js

var _ = require('underscore');
var util = require('util');

var extractor = require('translators').cmumps;
var translator = require('translators').demographics;

var cmumps2fhir = require('./cmumps2fhir');
var compHelper = require('../src/component-helper');
var wrapper = require('../src/javascript-wrapper');

var debug = compHelper.debugAll || false;

module.exports = wrapper(patientDemographics);

/** 
 * Given patient data, extracts the patient demographics and translates
 * it to FHIR format.
 * 
 * @param data cmumps {object} patient data to be translated
 * @param cmumps_file {string} output path for writing json intermediate file for cmumps data.
 *                             May be undefined.
 * @param fhir_file {string} output path for writing json intermediate file for fhir data.
 *                             May be undefined.
 * 
 * @return the patient's demographic data in FHIR format
 */
function patientDemographics(data, cmumps_file, fhir_file) {   

    if (debug) {
        console.log( '\nEnter ' + compHelper.formattedNodeName(this.nodeInstance));
        // console.log('data: ',util.inspect(data,{depth:null})+'\n');
    }


    if (_.isUndefined(data)) { 
        throw Error("PatientDemographics requires data to translate!");
    }

    var translation = cmumps2fhir(data,  
                                  extractor.extractDemographics, 
                                  translator.translateDemographicsFhir,
                                  cmumps_file,
                                  fhir_file);

    return (_.isArray(translation) && translation.length === 1) ? translation[0] : translation;
}
