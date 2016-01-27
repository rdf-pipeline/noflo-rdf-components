// state-component.js

var _ = require('underscore');
var jsonpointer = require('jsonpointer');
var promiseComponent = require('./promise-component');

/**
 * This combines payloads, from multiple ports, arriving in an asynchronous
 * fashion. Each port may include an indexBy function, property, or path
 * that will be used to determine a key that must match payloads from other ports.
 * If no indexBy is provided then the payload will match any payload from other ports.
 * A provided onchange function is called when payload is received (from all
 * required port) with payload having the same key from all other inPorts.
 *
 * Usage:
 *   stateComponent({
 *     inPorts: {name:{indexBy:function(payload)}} of port names to port options || [] of port names,
 *     onchange: function(inPayloads, outPayload) {
 *         inPayloads = {name:payload} of port names to last payload,
 *         outPayload = previous result of onchange
 *     }
 *   });
 */
module.exports = function(def){
    var inPorts = _.isArray(def.inPorts) ? _.object(def.inPorts, []) : def.inPorts;
    var required = _.compact(_.map(inPorts, function(port, name){
        return port && port.required && name;
    }));
    return promiseComponent(_.defaults({
        inPorts: _.mapObject(inPorts, function(port, name) {
            return _.extend({
                ondata: _.compose(
                    fireChangeEvent(required, def.onchange),
                    indexPayload(port && port.indexBy, name)
                )
            }, port);
        }),
    }, def));
};

function indexPayload(indexBy, name) {
    var by = _.isFunction(indexBy) ? indexBy : pointer(indexBy);
    return function(payload, socketIndex) {
        // determine a key string or undefined if no key should be used
        var key = indexBy == null ? undefined : ('' + by.call(this, payload));
        var payloads = this.inPayloads || {};
        var index = _.isUndefined(key) ? payload :
            _.extend(payloads[name] || {}, _.object([key], [payload]));
        this.inPayloads = _.extend(payloads, _.object([name], [index]));
        return key;
    };
}

function fireChangeEvent(required, onchange) {
    return function(key) {
        var wild = _.pick(this.inPayloads, isWild.bind(this));
        if (_.isUndefined(key)) {
            // no key for this event, first with only wild matching payloas
            var missing = _.difference(required, _.keys(wild));
            if (_.isEmpty(missing) && _.isFunction(onchange)) {
                var self = this;
                return Promise.resolve(onchange.call(this, wild, this.outPayload)).then(function(result){
                    return self.outPayload = result;
                });
            }
        } else {
            // a particular key must match payload (or be wild matching)
            var payloads = _.extend(_.mapObject(this.inPayloads, _.property(key)), wild);
            var missing = _.difference(required, _.keys(payloads));
            if (_.isEmpty(missing) && _.isFunction(onchange)) {
                var outPayloads = this.outPayloads = this.outPayloads || {};
                return Promise.resolve(onchange.call(this, payloads, outPayloads[key])).then(function(result){
                    return outPayloads[key] = result;
                });
            }
        }
    }
}

function pointer(path) {
    if (path && path.charAt(0) == '/')
        return jsonpointer.compile(path).get;
    else return _.property(path);
}

function isWild(data, name) {
    return this.inPorts[name].options.indexBy == null;
}
