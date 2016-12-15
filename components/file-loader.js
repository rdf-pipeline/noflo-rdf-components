// file-loader.js

var _ = require('underscore');
var fs = require('fs');

var createLm = require('../src/create-lm.js');
var stateFactory = require('../src/create-state.js');
var logger = require('../src/logger.js');
var wrapper = require('../src/javascript-wrapper.js');

module.exports = wrapper({description: "Reads a file, one line at a time, and sends each "+
                                       "line number and its content to the next component",
                          isTransient: true,
                          icon: 'upload',
                          updater: loader});

/** 
 * Reads a file with one record per line, and sends it on to the next downstream node(s).
 *
 * This component is typically placed at the front of a pipeline to feed the load-balancer,
 * throttle, or funnel. 
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
function loader(file_envvar, encoding, use_default_vni, metadata_key, kick) {

    if (_.isUndefined(use_default_vni) ||
        (_.isBoolean(use_default_vni) && !use_default_vni)) {
 
        // Using one VNI for each id in the file (similar to a split); On this path,
        // we are sending all the VNIs downstream at once. 
        var filename = getFilename(file_envvar);
        var ids = fs.readFileSync(filename, encoding).toString().split("\n");
        if (_.isEmpty(ids)) {
            logger.warn('No data found in', process.env.file_envvar);
            return;
        }

        var outputPort = this.nodeInstance.outPorts.output;
        for (var i=0, maxId=ids.length; i <= maxId; i++) { 
            var id = ids[i];
            if (!_.isEmpty(id)) {
                var state = stateFactory((i+1).toString(), id, createLm());
                if (!_.isEmpty(metadata_key)) {
                    state[metadata_key] = id;
                }
                outputPort.sendIt(state);
            }
        }

    } else { 

        // Using the default VNI; on this path, we'll send one id at a time, overwriting 
        // the default VNI data with the next id each time, ever time we get a new kick.
        var metadataKey = _.isEmpty(metadata_key) ? 'id' : metadata_key;
        var node = this.nodeInstance;
        if (_.isUndefined(node.fileLoader)) {
            // initialize the state the first time through
            var filename = getFilename(file_envvar);
            node['fileLoader'] = {};
            node.fileLoader.index= -1;
            node.fileLoader.ids = fs.readFileSync(filename, encoding).toString().split("\n");
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
            this.outputState({[metadataKey]: id});
            return id;
        } 
    }
}

/** 
 * Get the file name from the specified env var.  It is stored in an env
 * var so the file name can be changed without changing the graph config
 */
function getFilename(file_envvar) {
 
    if (_.isEmpty(file_envvar)) 
        throw new Error('File-loader requires a file environment variable with file to load!');

    var filename = process.env[file_envvar.toString()];
    if (_.isUndefined(filename)) { 
        throw Error('File-loader environment variable ' + file_envvar.toString() + ' is not defined!');
    }

    return filename;
}
