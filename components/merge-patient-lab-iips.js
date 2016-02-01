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

    outPorts: { 
      out: { 
          description: "output port",
          datatype: 'string',
          required: true
      }
    },

    updater: function( patient, labwork, out ) {   

        // Attempt to read and parse the JSON input 
        var labwork = JSON.parse( labwork.toString() );
        var patient = JSON.parse( patient.toString() );

        var patientLab = _.extend( {},
                                   patient,
                                   labwork );

        return { out: out, 
                 data: patientLab };
    }  
});
