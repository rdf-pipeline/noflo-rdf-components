// state-component.js

var _ = require('underscore');
var jsonpointer = require('jsonpointer');
var promiseComponent = require('./promise-component');

/**
 * Stores the last packet for every inPort and calls an onchange function
 * when received and after when all required port have received something.
 * If multiple ports both provide an indexBy property name, path or function,
 * only packets that both resolve to the same key with be called together.
 *
 * Usage:
 *   stateComponent({
 *     inPorts: {} of port names to port options || [] of port names,
 *     onchange: function(inStates, outState) {
 *         inStates = {} of port names to state,
 *         outState = previous result of onchange
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
        var state = this.inStates || {};
        var index = indexBy == null ? payload :
            _.extend(state[name] || {}, _.object([key], [payload]));
        this.inStates = _.extend(state, _.object([name], [index]));
        return key;
    };
}

function change(required, onchange) {
    return function(key) {
        var wildStates = _.pick(this.inStates, isWild.bind(this));
        if (_.isUndefined(key)) {
            var missing = _.difference(required, _.keys(wildStates));
            if (_.isEmpty(missing) && _.isFunction(onchange)) {
                var self = this;
                return Promise.resolve(onchange.call(this, wildStates, this.outState)).then(function(result){
                    return self.outState = result;
                });
            }
        } else {
            var state = _.extend(_.mapObject(this.inStates, _.property(key)), wildStates);
            var missing = _.difference(required, _.keys(state));
            if (_.isEmpty(missing) && _.isFunction(onchange)) {
                var outStates = this.outStates = this.outStates || {};
                return Promise.resolve(onchange.call(this, state, outStates[key])).then(function(result){
                    return outStates[key] = result;
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
