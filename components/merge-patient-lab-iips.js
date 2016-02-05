/**
 * File:  merge-patient-lab-iips.js
 *
 * Given a json string or a js object of patient data and json string of patient lab work, this
 * simple test component merges the two into a single javascript object and returns it 
 */

var _ = require('underscore');

var jswrapper = require('./javascript-wrapper');

exports.getComponent = jswrapper({

    description: "merges a pair of patient and lab IIPs together into a single combined record.",

    inPorts: { 
        patient: { 
            datatype: 'string',
            description: "a JSON patient record to be processed",
            required: true
        },

        labwork: {
            datatype: 'string',
            description: "a JSON lab record to be processed",
            required: true
        }
    },

    /**
     * Simply merges a patient and lab record into one.
     *
     * @param patient patient record to be merged
     * @param labwork lab record to be merged
     * @this component context
     *
     * @return the combined patient/lab record
     */
    updater: function( patient, labwork ) {   

        patient = ( _.isString( patient ) ) ? JSON.parse( patient ) : patient;
        labwork = ( _.isString( labwork ) ) ? JSON.parse( labwork ) : labwork;
        var patientLab = _.extend( {},
                                   patient,
                                   labwork );
    
        return patientLab;
    }  
});
