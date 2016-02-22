// promise-output.js

var _ = require('underscore');

/**
 * Captures thrown errors from a function and sends them to the
 * 'error' port, and sends the result (maybe a Promise) of the handler function to
 * the 'output' port.
 *
 * Usage:
 *  componentFactory({
 *      inPorts: {input:{ondata:promiseOutput(function(payload))}},
 *      outPorts: promiseOutput.outPorts
 *  });
 */
module.exports = function(handler){
    return _.wrap(handler, wrapHandler);
};

module.exports.outPorts = {
    output: {
        description: "Resolved result of the updater",
        datatype: 'object'
    },
    error: {
        description: "Rejected error of the updater",
        datatype: 'object'
    }
};

/**
 * Wrap the handler function in a Promise to capture errors and return objects.
 * Errors are sent to the error port and non-undefined results are sent to the
 * output port. If the result is an array, each item is sent separately.
 * @this a Component or Port
 * @param handler a function
 * @param payloads hash of portNames to payloads
 */
function wrapHandler(handler /* arguments */) {
    var node = this.nodeInstance || this;
    var args = _.toArray(arguments).slice(1);
    return Promise.resolve(this).then(function(context){
        return handler.apply(context, args);
    }).then(sendOutput.bind(node), sendError.bind(node));
}

/**
 * Handle result of a function call.
 * @this Component with this.outPorts.output Port
 */
function sendOutput(resolved) {
    var port = this.outPorts.output;
    if (_.isArray(resolved)) {
        port.connect();
        resolved.forEach(port.send.bind(port));
        port.disconnect();
    } else if (!_.isUndefined(resolved)) {
        port.send(resolved);
        port.disconnect();
    }
}

/**
 * Handle error from a function call.
 * @this Component with this.outPorts.error Port
 */
function sendError(rejected) {
    if (this.outPorts.error.listAttached().length) {
        // TODO check error update policy first issue#22
        this.outPorts.error.send(rejected);
        this.outPorts.error.disconnect();
    } else {
        console.error(rejected);
    }
}
