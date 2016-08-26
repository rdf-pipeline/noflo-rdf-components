// add-metadatum.js

var _ = require('underscore');

var createLm = require('../src/create-lm');
var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper({description: "Adorns a VNI with single metadata attribute.",
                          icon: "tag",
                          updater: addMetadatum});

/**
 * Adds a name/value pair as metadata to the vni
 * 
 * @this vni context
 * @param name of metadata attribute
 * @param value value to be associated with that name
 * @param data whatever the upstream nodes have produced as incoming data
 * 
 * @return data whatever the original incoming data was
 */
function addMetadatum(name, value, data) {

    if (_.isEmpty(name)) { 
        throw Error('Cannot add metadata with no name!');
    } 

    this.outputState({[name]:value, lm: createLm()});
    
    // Just return whatever the original data was to keep moving it downstream
    return data;
}
