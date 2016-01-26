// state-component.js

var _ = require('underscore');
var jsonpointer = require('jsonpointer');
var promiseComponent = require('./promise-component');

/**
 * Stores the most recent packet for every inPort and calls an onchange function
 * when they change and after when all required port have received something.
 * If multiple ports both provide an indexBy property name or function,
 * only packets that both resolve to the same value with be called together
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
        var key = by.call(this, payload);
        var state = this.state || {};
        var index = indexBy == null ? payload :
            _.extend(state[name] || {}, _.object([key], [payload]));
        this.state = _.extend(state, _.object([name], [index]));
        return key;
    };
}

function change(required, onchange) {
    return function(key) {
        var inPorts = this.inPorts;
        var state = _.mapObject(this.state, function(index, name) {
            if (inPorts[name].options.indexBy == null) return index;
            else return index[key];
        });
        var missing = _.difference(required, _.keys(state));
        if (_.isEmpty(missing) && _.isFunction(onchange))
            return onchange.call(this, state);
    }
}

function pointer(path) {
    if (path && path.charAt(0) == '/')
        return jsonpointer.compile(path).get;
    else return _.property(path);
}
