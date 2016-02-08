// store-payload.js

var _ = require('underscore');
var noflo = require('noflo');

/**
 * Stores the given payload for later use and returns a hash of the payloads by
 * port names. If a vnid property is included in the payload, each payload with
 * a unique vnid will be stored and only payloads with the same vnid will be
 * returned. If a port is addressable then the payload from each socket is
 * stored separately and an Array of payloads is returned for those ports.
 *
 * Usage:
 *  ondata({vnid:'001',data:{},lm:'LM'}, 0) : {
 *      input: {vnid:'001',data:{},lm:'LM'}
 *  }
 */
module.exports = function(payload, socketIndex){
    var vnid = _.has(payload, 'vnid') ? ('' + payload.vnid) : '';
    storePayload(this, socketIndex, vnid, payload);
    var inPorts = _.pick(this.nodeInstance.inPorts.ports, isPort);
    var outPorts = _.pick(this.nodeInstance.outPorts.ports, isPort);
    return _.defaults(
        _.mapObject(inPorts, retrievePayload.bind(this, vnid)),
        _.mapObject(outPorts, retrievePayload.bind(this, vnid))
    );
}

/**
 * Stores a payload on the given port by socketIndex and vnid.
 * @param port the port to store the payload on
 * @param socketIndex the index number of the socket for this payload or undefined
 * @param vnid an identifier for the payload
 */
function storePayload(port, socketIndex, vnid, payload) {
    var addressable = port.isAddressable();
    var rpf = port.rpf = port.rpf || {};
    if (addressable) {
        rpf.payloads = rpf.payloads || [];
        rpf.payloads[socketIndex] = rpf.payloads[socketIndex] || {};
        rpf.payloads[socketIndex][vnid] = payload;
    } else {
        rpf.payloads = rpf.payloads || {};
        rpf.payloads[vnid] = payload;
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
