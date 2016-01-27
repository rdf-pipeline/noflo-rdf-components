// vni-component.js

var _ = require('underscore');
var stateComponent = require('./state-component');

/**
 * Provides the vnid to the out payload and reads/hides the vnid on the in payload
 */
module.exports = function(def){
    if (!_.isFunction(def.onstatechange)) throw Error("onstatechange must be a function");
    var inPorts = _.isArray(def.inPorts) ? _.object(def.inPorts, []) : def.inPorts;
    return stateComponent(_.defaults({
        inPorts: _.mapObject(inPorts, function(port, name) {
            return _.extend({
                indexBy: function(payload) {
                    if (payload.vnid != null) return payload.vnid;
                    else return ''; // Means single state
                }
            }, port);
        }),
        onchange: function(inPayloads, outPayload) {
            var vnid = _.first(_.compact(_.pluck(inPayloads, 'vnid')));
            var inStates = _.mapObject(inPayloads, function(payload){
                if (payload.vnid == null) return payload;
                else return payload.state;
            });
            var outState = outPayload && outPayload.vnid != null ?
                outPayload.state : outPayload;
            return Promise.resolve(def.onstatechange(inStates, outState)).then(function(outState){
                if (vnid == null) return outState;
                else return {
                    vnid: vnid,
                    state: outState
                };
            });
        }
    }, def));
};
