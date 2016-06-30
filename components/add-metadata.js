// add-metadata.js

var _ = require('underscore');

var createLm = require('../src/create-lm');
var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper(addMetadata);

/**
 * Adds custom metadata to the vni
 * 
 * @param name of metadata attribute
 * @param value value to be associated with that name
 */
function addMetadata(name, value) {

    if (_.isEmpty(name)) { 
        throw Error('Cannot add metadata with no name!');
    } 

    this.outputState({[name]:value, lm: createLm()});
    
    // Just return whatever the original data was to keep moving it downstream
    return this.data;
}
