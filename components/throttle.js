// throttle.js

var _ = require('underscore');
var fs = require('fs');

var logger = require('../src/logger.js');
var wrapper = require('../src/split-wrapper.js');

module.exports = wrapper(throttler);

/** 
 * Reads a file with one record per line, and outputs a hash with the 
 * throttle_size number of entries for processing downstream. For example, 
 * given a file with values 1, 2, 3, 4 and a throttle size of 2, this 
 * component would first output a hash that reads {"1": "1", "2": "2"}.  If a 
 * subsequent throttle size packet of 1 comes in, it would then send 
 * {"3": "3"}.  One more packet of size 1 would send {"4": "4"}.
 *
 * This component uses the split-wrapper, so after the hash is returned, the 
 * wrapper will split the hash into one send for every hash element.  Thus in the
 * example above, the first time through, it will actually send two packets.  
 * The first packet will contain "1", and the second packet will contain "2".
 * The second time through, a packet of "3" would be sent.  The third time,
 * a packet of "4" would be sent.
 *
 * This component is typically placed at the front of a pipeline to 
 * avoid flooding the pipeline with too many requests.  It is most often
 * used with the throttle-fire component at the end of the pipeline to 
 * notify the throttle when it's time to send the next batch of elements
 * on for processing.
 * 
 * @this vni
 *
 * @param throttle_size - the number of hash values to be sent 
 * @param file_envvar an environment variable with the path to the file
 *                    to be processed.
 * @param encoding - file encoding; defaults to UTF-8
 *
 * @return a hash with the next elements to be processed.
 */
function throttler(throttle_size, file_envvar, encoding) {
    var node = this.nodeInstance;
    if (_.isUndefined(node.throttle)) node['throttle'] = {}; 

    // Get the number of hash elements being requested
    var throttleSize = _.isFinite(throttle_size) ? +throttle_size : 1;

    // Read the file if we haven't got any pending data e.g., first time
    if (_.isEmpty(node.throttle)) { 
        var filename = getFilename(file_envvar);
        var ids = fs.readFileSync(filename, encoding).toString().split("\n");
        if (_.isEmpty(ids))  
            logger.warn('No data found in', process.env.file_envvar);
        node.throttle['idIndex'] = 0;
        node.throttle['ids'] = ids;
    }

    var throttleSettings = node.throttle;
 
    // Do we have any more elements to be processed? 
    if (throttleSettings.ids.length > throttleSettings.idIndex + 1) { 

        // Set the number of elements we should have processed 
        // after setting this hash. 
        var elementsProcessed = throttleSettings.idIndex + throttleSize;
        if (elementsProcessed > throttleSettings.ids.length) {
            // Do not have enough elements left so set to the number 
            // of elements we have left and pass that on
            elementsProcessed = throttleSettings.ids.length;
        }

        // Build a hash with the correct number of elements
        var hash = {};
        for (; throttleSettings.idIndex < elementsProcessed; throttleSettings.idIndex++) { 
            var id = throttleSettings.ids[throttleSettings.idIndex];
            hash[id] = id;
        }

        return hash; 
     } else {
        logger.debug('All Ids have been processed.');
     }

     // If we get here, there's no new data to pass downstream so just return
}

/** 
 * Get the file name from the specified env var.  It is stored in an env
 * var so the file name can be changed without changing the graph config
 */
function getFilename(file_envvar) {
 
    if (_.isEmpty(file_envvar)) 
        throw Error('Throttle requires an environment variable file_envvar to specify the data to process!');

    var filename = process.env[file_envvar.toString()];
    if (_.isUndefined(filename)) { 
        throw Error('Throttle environment variable ' + file_envvar.toString() + ' is not defined!');
    }

    return filename;
}
