// file-loader.js

var _ = require('underscore');
var fs = require('fs');

var createLm = require('../src/create-lm.js');
var createState = require('../src/create-state.js');
var logger = require('../src/logger.js');
var wrapper = require('../src/javascript-wrapper.js');

module.exports = wrapper({description: "Reads a file, one line at a time, and sends each "+
                                       "line number and its content to the next component",
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
 *
 * @return a hash with the next elements to be processed.
 */
function loader(file_envvar, encoding) {

    var filename = getFilename(file_envvar);
    
    var ids = fs.readFileSync(filename, encoding).toString().split("\n");
    if (_.isEmpty(ids)) {
        logger.warn('No data found in', process.env.file_envvar);
        return;
    }

    var outputPort = this.nodeInstance.outPorts.output;
    for (var i=0, maxId=ids.length; i <= maxId; i++) { 
        if (!_.isEmpty(ids[i])) {
            outputPort.sendIt(createState((i+1).toString(), ids[i], createLm()));
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
