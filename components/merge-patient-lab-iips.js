/**
 * File:  merge-patient-lab-iips.js
 *
 * Given a json string or a js object of patient data and json string of patient lab work, this
 * simple test component merges the two into a single javascript object and returns it 
 */

var _ = require('underscore');

var jswrapper = require('../src/javascript-wrapper');

module.exports = jswrapper( mergePatientLabs );


    /**
     * Simply merges a patient and lab record into one.
     *
     * @param patient patient record to be merged
     * @param labwork lab record to be merged
     * @this component context
     *
     * @return the combined patient/lab record
     */
    function mergePatientLabs( patient, labwork ) {   

        patient = ( _.isString( patient ) ) ? JSON.parse( patient ) : patient;
        labwork = ( _.isString( labwork ) ) ? JSON.parse( labwork ) : labwork;
        var patientLab = _.extend( {},
                                   patient,
                                   labwork );
    
        return patientLab;
    }  
