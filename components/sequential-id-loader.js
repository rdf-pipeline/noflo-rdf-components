// sequential-id-loader.js

var _ = require('underscore');
var fs = require('fs');

var dataUtils = require('./lib/data-utils');
var createLm = require('../src/create-lm');
var stateFactory = require('../src/create-state');
var logger = require('../src/logger');
var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper({description: "Reads a file, one line at a time, and sends each "+
                                       "line number and its content to the next component",
                          isTransient: true,
                          icon: 'upload',
                          updater: idLoader});

/** 
 * Reads a file with one record per line, and sends it on to the next downstream node(s).  
 * Waits until kicked before sending the next record or patient ID on. 
 *
 * This component is typically placed at the front of a pipeline to feed the load-balancer,
 * throttle, or funnel with patient Ids.   This is useful when you want to completely process one 
 * record (e.g., one patient) at a time, and then kick the loader for the next record/patient to
 * be put into the pipeline
 * 
 * @this vni
 *
 * @param file_envvar an environment variable with the path to the file
 *                    to be processed.
 * @param encoding - file encoding; defaults to UTF-8
 * @param use_default_vni (optional) - use the default VNI if true; split into separate VNIs if not
 * @param kick (optional) - used to trigger sending the next file value when use_default_vni is true
 *
 * @return a hash with the next elements to be processed.
 */
function idLoader(file_envvar, encoding, use_default_vni, metadata_key, kick) {

    // Using the default VNI; on this path, we'll send one id at a time, overwriting 
    // the default VNI data with the next id each time, ever time we get a new kick.
    var metadataKey = _.isEmpty(metadata_key) ? 'id' : metadata_key;
    var node = this.nodeInstance;
    if (_.isUndefined(node.fileLoader)) {
        // initialize the state the first time through
        var filename = getFilename(file_envvar);
        node['fileLoader'] = {};
        node.fileLoader.index= -1;
        node.fileLoader.ids = dataUtils.readFileData(filename, encoding, 'Sequential id Loader', 'ids').toString().split("\n");
        node.fileLoader.max = _.isEmpty(node.fileLoader.ids) ? 0 : node.fileLoader.ids.length; 
        if (node.fileLoader.max === 0) {
            logger.warn('No data found in', process.env.file_envvar);
        }
    }

    // Send the next content on downstream 
    node.fileLoader.index++;
    var id = node.fileLoader.ids[node.fileLoader.index];
    if (node.fileLoader.index < node.fileLoader.max && !_.isEmpty(id)) { 
        stateFactory.clearMetadata(this.outputState());
        if (use_default_vni !== true) { 
            this.outputState( stateFactory(id, id, createLm()) );
        }
        this.outputState({[metadataKey]: id});
        return id;
    }
}

/** 
 * Get the file name from the specified env var.  It is stored in an env
 * var so the file name can be changed without changing the graph config
 */
function getFilename(file_envvar) {
 
    if (_.isEmpty(file_envvar)) 
        throw new Error('Sequential file loader requires a file environment variable with file to load!');

    var filename = process.env[file_envvar.toString()];
    if (_.isEmpty(filename)) { 
        throw Error('Sequential file loader environment variable "' + file_envvar.toString() + '" does not contain a file name!');
    }

    return filename;
}
