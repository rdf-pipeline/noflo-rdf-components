// file-loader.js

var _ = require('underscore');
var fs = require('fs');

var logger = require('../src/logger.js');
var wrapper = require('../src/split-wrapper.js');

module.exports = wrapper({description: "Reads a file, one line at a time, and sends each "+
                                       "line number and its content to the next component",
                          icon: 'upload',
                          updater: loader});

/** 
 * Reads a file with one record per line, and outputs a hash with the 
 * each line. For example, given a file with values 1, 2, 3, 4, this 
 * component would output a hash that reads {"1": "1", "2": "2", "3":"3", "4":"4"}.  
 *
 * This component uses the split-wrapper, so after the hash is returned, the
 * wrapper will split the hash into one VNI for each hash element.  Thus in the
 * example above, the first VNI packet will contain "1", and the second will       
 * contain "2"; the third time, "3", etc.
 *
 * This component is typically placed at the front of a pipeline to 
 * to feed the load-balancer. 
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

    // Build a hash with the correct number of elements
    var hash = {};
    for (var id=0, maxId=ids.length; id <= maxId; ++id) { 
        if (!_.isEmpty(ids[id])) hash[id+1] = ids[id];
    }

    return hash; 
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
