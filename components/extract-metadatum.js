// extract-metadatum.js

var _ = require('underscore');

var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper({description: "Extracts the specified metadata attribute from the VNI.",
                          icon: "hand-grab-o",
                          isTransient: true,
                          updater: extractMetadatum});

/**
 * extracts the specified metadata attribute from the input VNI and returns it.
 * 
 * @this vni context
 * @param name of metadata attribute to extract
 * @param input whatever the upstream nodes have produced as incoming data
 * 
 * @return the metadata value 
 */
function extractMetadatum(name, input) {

    if (_.isEmpty(name)) { 
        throw Error('Cannot extract metadata attribute with no name!');
    } 

    var inputState = this.inputStates('input');
    if (_.isUndefined(inputState[name])) {
        throw Error('Metadata attribute ' + name + ' does not exist!');
    }

    return inputState[name];
}
