// and-gate.js

var _ = require('underscore');

var logger = require('../src/logger');
var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper({description: "waits for all connected edges to send input, " +
                                       "then returns an array of the input values received.",
                          icon: 'plus-square-o',
                          inPorts:{
                              input:{multi: true}
                          },
                          updater: andGate});

/**
 * Takes any number of inputs, waiting until all edges have sent something.  Builds an 
 * array with the data from each input, ordered by socket number, and returns the array.
 */
function andGate(input) {
    if (_.isEmpty(input)) return input;

    var result = _.unique(input);
    this.clearTransientInputs();

    logger.debug('And gate returning: ',result,
                 ' with input states: ',this.inputStates());
    return (result.length == 1) ? result[0] : result;
}
