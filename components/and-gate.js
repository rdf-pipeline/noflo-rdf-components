// and-gate.js

var _ = require('underscore');

var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper({description: "waits for all connected edges to send input, " +
                                       "then returns an array of the input values received.",
                          icon: 'plus-square-o',
                          inPorts:{
                              input:{multi: true}
                          },
                          isTransient: true,
                          updater: andGate});

/**
 * Takes any number of inputs, waiting until all edges have sent something.  Builds an 
 * array with the data from each input, ordered by socket number, and returns the array.
 */
function andGate(input) {
    return input;
}
