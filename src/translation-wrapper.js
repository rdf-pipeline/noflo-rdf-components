// translation-wrapper.js

var _ = require('underscore');

var createLm = require('./create-lm');
var createState = require('./create-state');
var logger = require('./logger');
var ondata = require('./framework-ondata');
var wrapper = require('./javascript-wrapper');
var wrapperHelper = require('./wrapper-helper');

/**
 * Overrides the "input" port to split the data into multiple states using the key as the vnid.
 */
module.exports = function(nodeDefOrUpdater) {
    var nodeDef = _.isFunction(nodeDefOrUpdater) ? {updater: nodeDefOrUpdater} : nodeDefOrUpdater || {};
    return wrapper(_.defaults({
        translator: true,
        inPorts: _.mapObject(_.extend({input:{}}, nodeDef.inPorts), function(port, portName) {
            if (portName != 'input') return port;
            else return _.extend({ondata: onsplit}, port);
        }),
    }, nodeDef));
};

function onsplit(payload, socketIndex) {
    if (_.isUndefined(payload)) return ondata(payload, socketIndex);
    var data = _.isUndefined(payload.vnid) ? payload : payload.data;
    if (!_.isObject(data)) throw Error('Translation wrapper requires a hash on the input port');
    var lm = createLm(); // Create an lm for the new vnis we will be sending
    var groupLm = payload.lm || createLm();
    _.each(_.pick(data, isAssignedToMe, this), function(element, vnid) {
        var state =  createState( vnid,
                                  element.data,
                                  lm, // Create an lm for the new vnis we will be sending
                                  payload.error,
                                  payload.stale,
                                  groupLm);
        createState.copyMetadata(payload, state); // copy metadata from payload state to the new state
        ondata.call(this, state, socketIndex);
    }, this);
}

function isAssignedToMe(data, vnid) {
    return !data.translateBy || data.translateBy == this.nodeInstance.componentName;
}
