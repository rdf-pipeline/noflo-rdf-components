// state-component.js

var _ = require('underscore');
var jsonpointer = require('jsonpointer');
var promiseComponent = require('./promise-component');

/**
 * Stores the last packet payload for every inPort and calls an onchange function
 * when received and after when all required port have received something.
 * If multiple ports both provide an indexBy property name, path or function,
 * only packets that both resolve to the same key with be called together.
 *
 * Usage:
 *   stateComponent({
 *     inPorts: {name:{indexBy:function(paylod)}} of port names to port options || [] of port names,
 *     onchange: function(inPayloads, outPayload) {
 *         inPayloads = {} of port names to last payload,
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
                ondata: _.compose(change(required, def.onchange), data(port && port.indexBy, name))
            }, port);
        }),
    }, def));
};

function data(indexBy, name) {
    var by = _.isFunction(indexBy) ? indexBy : pointer(indexBy);
    return function(payload, socketIndex) {
        var key = indexBy == null ? undefined : ('' + by.call(this, payload));
        var payloads = this.inPayloads || {};
        var index = indexBy == null ? payload :
            _.extend(payloads[name] || {}, _.object([key], [payload]));
        this.inPayloads = _.extend(payloads, _.object([name], [index]));
        return key;
    };
}

function change(required, onchange) {
    return function(key) {
        var wild = _.pick(this.inPayloads, isWild.bind(this));
        if (_.isUndefined(key)) {
            var missing = _.difference(required, _.keys(wild));
            if (_.isEmpty(missing) && _.isFunction(onchange)) {
                var self = this;
                return Promise.resolve(onchange.call(this, wild, this.outPayload)).then(function(result){
                    return self.outPayload = result;
                });
            }
        } else {
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
