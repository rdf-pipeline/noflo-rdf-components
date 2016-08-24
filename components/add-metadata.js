// add-metadata.js

var _ = require('underscore');

var createLm = require('../src/create-lm');
var createState = require('../src/create-state');
var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper({description: "Adorns a VNI with multiple metadata attributes.",
                          icon: "tags",
                          isTransient: true,
                          updater: addMetadata});

/**
 * Adds all attributes of the specified metadata object as custom metadata to the vni. 
 * 
 * @this vni context
 * @param metadata an object with the name/value pairs of metadata to be added to the VNI 
 * @param data whatever the upstream nodes have produced as incoming data
 * 
 * @return data whatever the original incoming data was
 */
function addMetadata(metadata, data) {

    if (_.isEmpty(metadata) || ! _.isObject(metadata)) {
        throw Error("Expected a metadata object found with attributes to be added to the VNI!");
    }

    var keys = Object.keys(metadata);
    if (_.isEmpty(keys)) { 
        throw Error('Add metadata component requires at least one key and value pair.');
    }

    var outputState = this.outputState();
    keys.forEach( function(key) { 
        if (_.find(createState.STATE_KEYS, key)) { 
            throw Error("Attempted to overwrite protected vni element:", key);
        } else {
            outputState[key] = metadata[key];
        }
    });
    this.outputState({lm:createLm()});
    
    // Just return the VNI data to keep moving it downstream
    return data;
}
