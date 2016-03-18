/**
 * File:  merge-patient-lab-iips.js
 *
 * Given a json string or a js object of patient data and json string of patient lab work, this
 * simple test component merges the two into a single javascript object and returns it 
 */

var _ = require('underscore');

var jswrapper = require('../src/javascript-wrapper');

/**
 * Simply merges a patient and lab record into one.
 *
 * @param patient a JSON patient record to be processed
 * @param labwork a JSON lab record to be processed
 * @this component context
 *
 * @return the combined patient/lab record
 */
module.exports = jswrapper(function(patient, labwork) {
    patient = _.isString(patient) ? JSON.parse(patient) : patient;
    labwork = _.isString(labwork) ? JSON.parse(labwork) : labwork;
    return _.extend({}, patient, labwork);
});
