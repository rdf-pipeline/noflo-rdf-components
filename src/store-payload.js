// store-payload.js

var _ = require('underscore');
var noflo = require('noflo');

/**
 * Stores the given payload for later use or returns a hash of the payloads by
 * port names. Each payload will have a unique index by vnid. If a port is
 * addressable then the payload from each socket is stored separately and an
 * Array of payloads is returned for those ports. Omitting the payload will
 * not change anything, but return a hash of payloads by port name. Passing an
 * undefined payload will remove any existing the indexed payload entry.
 *
 * @param port a noflo Port
 * @param vnid a String
 * @param payload the optional object to store, otherwise retrieves 
 * @param if the port is addressable, the unique socket index for this port, otherwise undefined
 *
 * Usage:
 *  ondata(new noflo.Port(), '001', {vnid:'001',data:{},lm:'LM'}, 0) : {
 *      input: {vnid:'001',data:{},lm:'LM'}
 *  }
 */
module.exports = function(port, vnid, payload, socketIndex){
    if (!isPort(port)) throw Error("First argument must be a port");
    if (vnid == null) vnid = ''; // treat null/undefined as ''
    else if (!_.isString(vnid)) throw Error("Second argument must be a string");
    if (arguments.length < 3) {
        var inPorts = _.pick(port.nodeInstance.inPorts.ports, isPort);
        var outPorts = _.pick(port.nodeInstance.outPorts.ports, isPort);
        return _.defaults(
            _.mapObject(inPorts, retrievePayload.bind(this, vnid)),
            _.mapObject(outPorts, retrievePayload.bind(this, vnid))
        );
    } else {
        storePayload(port, vnid, payload, socketIndex);
        return this;
    }
};

/**
 * Stores a payload on the given port by socketIndex and vnid.
 * @param port the port to store the payload on
 * @param vnid a String to index the payload by
 * @param payload the object to store or if undefined delete
 * @param socketIndex the index number of the socket for this payload or undefined
 */
function storePayload(port, vnid, payload, socketIndex) {
    var payloads = getPayloads(port, socketIndex);
    if (_.isUndefined(payload)) {
        delete payloads[vnid];
    } else {
        payloads[vnid] = payload;
    }
}

/**
 * Checks if a port is addressable and returns the hash that should be used by
 * the index.
 * @param port the noflo.Port
 * @param socketIndex the socket index if the port is addressable
 */
function getPayloads(port, socketIndex) {
    var rpf = port.rpf = port.rpf || {};
    if (port.isAddressable()) {
        rpf.payloads = rpf.payloads || [];
        return rpf.payloads[socketIndex] = rpf.payloads[socketIndex] || {};
    } else {
        return rpf.payloads = rpf.payloads || {};
    }
}

/**
 * Retrieves the payload (or Array of payloads if addressable) for the given
 * vnid on the given port.
 * @param vnid the vnid that the payload should have, if not the empty string
 * @param port a port with the stored payloads
 */
function retrievePayload(vnid, port) {
    if (!port.rpf) return;
    var rpf = port.rpf;
    if (port.isAddressable()) {
        return _.map(rpf.payloads, function(payloads){
            return payloads[vnid] || payloads[''];
        });
    } else {
        return rpf.payloads[vnid] || rpf.payloads[''];
    }
}

/**
 * Determines if the given object is a port.
 * @param port an object that is a Port of the result is true
 */
function isPort(port) {
    return port instanceof noflo.InPort || port instanceof noflo.OutPort;
}
