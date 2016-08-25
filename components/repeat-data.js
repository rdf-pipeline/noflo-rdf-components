// repeat-data.js

var _ = require('underscore');

var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper({description: "Similar to core/Repeat, forwards packets and metadata in the same way it receives them, but within an RDF VNI context.",
                          icon: 'forward',
                          isTransient: true,
                          updater: repeatData});

/** 
 * updates the VNI with new data, without changing metadata
 * 
 * @param new_data data to be forwarded
 * @param old_data original VNI data on component input
 */
function repeatData(new_data, old_data) {
    return new_data;
}
