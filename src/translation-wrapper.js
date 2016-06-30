// translation-wrapper.js

var _ = require('underscore');

var compHelper = require('./component-helper');
var createLm = require('./create-lm');
var createState = require('./create-state');
var logger = require('./logger');
var ondata = require('./framework-ondata');
var wrapper = require('./javascript-wrapper');
var wrapperHelper = require('./wrapper-helper');

var debug = compHelper.debugAll || false;

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
    var groupLm = payload.lm || createLm();
    _.each(_.pick(data, isAssignedToMe, this), function(element, vnid) {
        ondata.call(this, createState(
            vnid,
            element.data,
            createLm(), // Create an lm for the new vnis we will be sending
            payload.error,
            payload.stale,
            groupLm
        ), socketIndex);
    }, this);
}

function isAssignedToMe(data, vnid) {
    return !data.translateBy || data.translateBy == this.nodeInstance.componentName;
}
