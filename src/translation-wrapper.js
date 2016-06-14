// translation-wrapper.js

var _ = require('underscore');
var wrapper = require('./javascript-wrapper');
var ondata = require('./framework-ondata');
var createLm = require('./create-lm');
var createState = require('./create-state');

module.exports = function(nodeDefOrUpdater) {
    var nodeDef = _.isFunction(nodeDefOrUpdater) ? {updater: nodeDefOrUpdater} : nodeDefOrUpdater || {};
    return wrapper(_.defaults({
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
    var groupLm = payload.lm || createLm();
    _.each(_.pick(data, isAssignedToMe, this), function(element, vnid) {
        ondata.call(this, createState(
            vnid,
            element,
            createLm(), // Create an lm for the new vnis we will be sending
            payload.error,
            payload.stale,
            groupLm
        ), socketIndex);
    }, this);
}

function isAssignedToMe(data, vnid) {
    return !data.translatedBy || data.translatedBy == this.nodeInstance.componentName;
}
