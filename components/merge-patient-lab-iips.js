// merge-patient-lab-iips.js

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

    updater: function( patient, labwork ) {   

        patient = ( _.isString( patient ) ) ? JSON.parse( patient ) : patient;
        labwork = ( _.isString( labwork ) ) ? JSON.parse( labwork ) : labwork;
        var patientLab = _.extend( {},
                                   patient,
                                   labwork );

        return patientLab;
    }  
});
