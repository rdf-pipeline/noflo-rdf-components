// onchange-component-factory.js

var _ = require('underscore');
var jsonpointer = require('jsonpointer');
var componentFactory = require('./event-component-factory');

/**
 * Combines payloads, from multiple ports, arriving in an asynchronous
 * fashion. Each port may include an indexBy function, property, or path
 * that will be used to determine a key that must match payloads from other ports.
 * If no indexBy is provided then the payload will match any payload from other ports.
 * A change event is triggered when payload is received (from all
 * required or attached ports) with payload having the same key from other ports.
 *
 * When payload is received on an indexed port change will be triggered with both
 * indexed payload and non-indexed payload. However, when payload is received on
 * a non-indexed port, change event is only triggered with other non-indexed payloads.
 *
 * Usage:
 *   componentFactory({
 *     inPorts: {input:{indexBy:'vnid'}},
 *     outPorts: {output:{indexBy:'vnid'}},
 *     onchange: function({input:payload,output:payload})
 *   });
 */
module.exports = function(def){
    return componentFactory(_.defaults({
        outPorts: _.mapObject(def.outPorts, indexData),
        inPorts: _.mapObject(def.inPorts, indexDataAndFireChange)
    }, def));
};

/**
 * Adds an ondata event handler (if one does not already exist) to the port
 * definition that will index the payload using an indexBy property on the port.
 * @param port port definition
 * @param portName port name
 */
function indexData(port, portName) {
    return _.extend({
        ondata: _.partial(indexPayload, createIndexBy(port), portName)
    }, port);
}

/**
 * Adds an ondata event handler (if one does not already exist) to the port
 * definition that will index the payload using an indexBy property on the port
 * and conditionally trigger a change event with the matching payload.
 * @param port port definition
 * @param portName port name
 */
function indexDataAndFireChange(port, portName, ports) {
    return _.extend({
        ondata: _.compose(
            _.partial(fireChangeEvent, _.keys(ports)),
            _.partial(indexPayload, createIndexBy(port), portName)
        )
    }, port);
}

/**
 * Higher level function to extract the key from a payload given a path or property name.
 * @param path JSON Pointer path or property name (that does not start with '/')
 * @param object to extract the key from
 */
function createIndexBy(port) {
    if (_.isFunction(port.indexBy))
        return port.indexBy;
    else if (_.isString(port.indexBy) && port.indexBy.charAt(0) == '/')
        return jsonpointer.compile(port.indexBy).get;
    else if (_.isString(port.indexBy))
        return _.property(port.indexBy);
}

/**
 * Higher level function to index payload by a given key.
 * @this Port that the payload was received on
 * @param indexBy property name, path, or function to index the payload by
 * @param portName the port name of the payload to index
 * @param payload to index
 */
function indexPayload(indexBy, portName, payload) {
    // determine a key string or undefined if no key should be used
    var key = indexBy == null ? undefined : ('' + indexBy.call(this, payload));
    var rpf = this.nodeInstance.rpf = this.nodeInstance.rpf || {};
    var payloads = rpf.payloads || {};
    var index = key == null ? payload :
        _.extend(payloads[portName] || {}, _.object([key], [payload]));
    rpf.payloads = _.extend(payloads, _.object([portName], [index]));
    return key;
}

/**
 * Higher level function that will trigger change event with payloads of the given key.
 * @this a Port with a nodeInstance property
 * @param required array of required port names that must receive something before calling onchange
 * @param onchange({portName:payload},previousResult) the function to call with the payloads of the key
 * @param key the key to that much match the payloads passed to onchange
 */
function fireChangeEvent(portNames, key) {
    var rpf = this.nodeInstance.rpf;
    var inPorts = _.pick(this.nodeInstance.inPorts, portNames);
    var required = _.keys(_.pick(inPorts, isRequiredOrAttached));
    var notIndexed = _.pick(rpf.payloads, isNotIndexed.bind(this.nodeInstance));
    var payloads = _.isUndefined(key) ? notIndexed :
        _.extend(_.mapObject(rpf.payloads, _.property(key)), notIndexed);
    var missing = _.difference(required, _.keys(payloads));
    if (_.isEmpty(missing)) this.nodeInstance.emit('change', payloads);
}

/**
 * Determines if the given port must have a matching payload before triggering a
 * change event.
 */
function isRequiredOrAttached(port, key) {
    // port.isAttached() is true if it has ever been attached
    return port.options.required || port.listAttached().length;
}

/**
 * Determines if the given payload, from the given port is NOT indexed.
 * @this a Component that includes inPorts and outPorts
 * @param payload
 * @param portName
 */
function isNotIndexed(payload, portName) {
    var port = this.inPorts[portName] || this.outPorts[portName];
    return port.options.indexBy == null;
}
