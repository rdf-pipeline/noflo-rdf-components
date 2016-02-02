// merge-patient-lab-iips.js

var _ = require('underscore');
var noflo = require('noflo');

exports.getComponent = function() {
    return _.extend(new noflo.Component({
        inPorts: {
            patient: {
            },
            labwork: {
            }
        }
    }), {
        description: "Will merges a pair of patient and lab IIPs together into a single combined record."
    });
};
