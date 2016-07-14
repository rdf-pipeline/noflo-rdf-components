// throttle-fire.js

var _ = require('underscore');

var wrapper = require('../src/javascript-wrapper.js');

/**
 * This component is usually used in conjunction with the throttle component 
 * or with the fire-throttle graph.  This component is used  to wait for 
 * input and return the throttle size controlling the number of elements 
 * to allow into the queue for processing. 
 *
 * The throttle component is usually used at the start of a pipeline to read
 * a file of records and sends a hash with the specified number of elements 
 * down stream to avoid flooding the request queue.  
 * 
 * This throttle-fire component is usually invoked at the end of a pipeline 
 * to make the throttle fire a new set of elements for processing. 
 * 
 * @param throttle_size the number of elements the throttle should feed into the
 *        pipeline now. 
 * @param input any data input from the upstream nodes that indicates data
 *        processing is done and the pipeline is ready for a new batch of 
 *        data.  The content doesn't matter.  Only that it has arrived.
 *
 * @return the number of elements the throttle should feed into the pipeline
 */
module.exports = wrapper(function(throttle_size, input) {

    // Get the number of elements to allow through the throttle now
    var throttleSize = parseInt(throttle_size);

    if (isNaN(throttleSize)) 
        throw Error("Throttle requires an integer throttle_size!  Received: '" +
                    throttle_size + "'");

    return throttleSize;
});
