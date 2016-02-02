// output-component-factory.js

var _ = require('underscore');
var componentFactory = require('./change-component-factory');

/**
 * Captures thrown errors from the onchange handler and sends them to the
 * 'error' port, and sends the result (maybe a Promise) of the handler function to
 * the 'output' port.
 *
 * Usage:
 *  componentFactory({
 *      inPorts: {input:{indexBy:'vnid'}} || ['input'],
 *      onchange: function({portName:payload})
 *  });
 */
module.exports = function(nodeDef){
    return componentFactory(_.defaults({
        inPorts: _.isArray(nodeDef.inPorts) ?
            _.object(nodeDef.inPorts, _.times(nodeDef.inPorts.length, _.object)) :
            nodeDef.inPorts,
        outPorts: _.extend({
            output: {
                description: "Resolved result of the updater",
                datatype: 'object'
            },
            error: {
                description: "Rejected error of the updater",
                datatype: 'object'
            }
        }, nodeDef.outPorts),
        onchange: _.wrap(nodeDef.onchange, wrapChangeHandler)
    }, nodeDef));
};

/**
 * Wrap the onchange handler function in a Promise to capture errors and return objects.
 * @this Component
 * @param handler onchange function
 * @param payloads hash of portNames to payloads
 */
function wrapChangeHandler(handler, payloads) {
    return Promise.resolve(payloads).then(handler.bind(this))
        .then(sendOutput.bind(this), sendError.bind(this));
}

/**
 * Handle result of onchange function call.
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
 * Handle error from onchange function call.
 * @this Component with this.outPorts.error Port
 */
function sendError(rejected) {
    if (this.outPorts.error.listAttached().length) {
        this.outPorts.error.send(rejected);
        this.outPorts.error.disconnect();
    } else {
        console.error(rejected);
    }
}
