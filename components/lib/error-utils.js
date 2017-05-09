/**
 * error-utils.js
 *
 * A library of error handling APIs for use in the noflo RDF pipeline component updaters.
 */

var _ = require('underscore');
var fs = require('fs');

var logger = require("../../src/logger");

module.exports = {
    defaultMessage: 'An error was detected',
    errorMessage: errorMessage
};

/**
 * If the data is a string, parses it as JSON  to get the equivalent javascript object.
 *If it is already a non-empty javascript object, it just returns it.
 *
 * @param message  (optional) a message to print to the console and use in generating an Error
 *                            Defaults to "An error was detected!"
 * @param err      (optional) original Error with more details on the problem; ignored if not provided
 *
 * @return an Error that can be thrown or used in a promise reject
 */
function errorMessage(message, err) {

    var msg = message || this.defaultMessage;

    var errMsg = msg;
    if (err instanceof Error) { 
        logger.error(msg + '\n', err);
        errMsg += '\n' + err.message;
    } else {
        logger.error(msg);
    }

    return Error(errMsg);
}
