// promise-component.js

var _ = require('underscore');
var noflo = require('noflo');

module.exports = function(def){
    if (_.isEmpty(def.inPorts)) throw Error("Missing inPorts");
    // resolvePort can be used to provide a custom resolvePort.name
    if (def.resolvePort && !_.isString(def.resolvePort.name))
        throw Error("Missing resolvePort name");
    // rejectPort can be used to provide a custom rejectPort.name
    if (def.rejectPort && !_.isString(def.rejectPort.name))
        throw Error("Missing rejectPort name");
    // use resolvePort or @out port or create a default
    var resolvePort = def.resolvePort || _.defaults({
        name: 'out'
    }, _.propertyOf(def.outPorts)('out')) || {
        name: 'out',
        description: "Resolved result of the updater",
        datatype: 'object',
        addressable: false,
        buffered: false,
        required: false,
        caching: false
    };
    // use rejectPort or @error port or create a default
    var rejectPort = def.rejectPort || _.defaults({
        name: 'error'
    }, _.propertyOf(def.outPorts)('error')) || {
        name: 'error',
        description: "Rejected error of the updater",
        datatype: 'object',
        addressable: false,
        buffered: false,
        required: false,
        caching: false
    };
    var inPorts = _.mapObject(def.inPorts, function(port, name){
        var process = port.process || function(event, payload, socketIndex) {
            var key = 'on' + event;
            if (port[key]) return port[key].call(this.nodeInstance, payload, socketIndex);
        };
        return _.defaults({
            process: function(event, payload, socketIndex) {
                var self = this;
                var outPorts = this.nodeInstance.outPorts;
                Promise.resolve().then(function(){
                    return process.call(self, event, payload, socketIndex);
                }).then(function(resolved){
                    if (!_.isUndefined(resolved)) {
                        outPorts[resolvePort.name].send(resolved);
                        outPorts[resolvePort.name].disconnect();
                    }
                }, function(rejected) {
                    if (outPorts[rejectPort.name].isAttached()) {
                        outPorts[rejectPort.name].send(rejected);
                        outPorts[rejectPort.name].disconnect();
                    } else {
                        console.error(rejected);
                    }
                });
            }
        }, port);
    });
    return function() {
        return _.extend(new noflo.Component({
            outPorts: _.defaults(_.object(
                [resolvePort.name, rejectPort.name],
                [_.clone(resolvePort), _.clone(rejectPort)]
            ), _.mapObject(def.outPorts, _.clone)),
            inPorts: _.mapObject(inPorts, _.clone)
        }), _.pick(def, 'description', 'icon'));
    };
};
