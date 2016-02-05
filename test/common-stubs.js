// common-stub.js

/**
 * This file contains the common code used for stubbing components for initial behavioral test specification
 */

var noflo = require('noflo');
var _ = require('underscore');

var commonTest = require('./common-test');

module.exports = {

    onceData: function(component, sendPort, sendPayload) {

        return new Promise(function(resolve, reject) {

            var output = noflo.internalSocket.createSocket();
            var error = noflo.internalSocket.createSocket();

            component.outPorts.output.attach(output);
            component.outPorts.error.attach(error);

            output.once('data', resolve);
	    error.once('data', reject);

            commonTest.sendData(component, sendPort, sendPayload);
        });
    },

    promiseLater: function(result) {

        return new Promise(function(cb) {

            setTimeout(cb, 50);
        }).then(_.constant(result));

    }
};
