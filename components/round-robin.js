// round-robin.js

var _ = require('underscore');
var noflo = require('noflo');

var componentFactory = require('../src/noflo-component-factory');

exports.getComponent = componentFactory({
    description: "Every data packet will be sent to at most one out-port socket",
    icon: 'refresh',
    outPorts: {
        output: {
            description: "Only one socket will receive each data packet",
            addressable: true,
            datatype: 'all'
        }
    },
    inPorts: {
        input: {
            description: "Each input group is send to exactly one output socket",
            addressable: true,
            datatype: 'all',
            required: true,
            ondata: send
        }
    }
});

function send(data) {
    var socketIndex = nextSocketIndex(this.nodeInstance);
    if (socketIndex != null) {
        var output = this.nodeInstance.outPorts.output;
        output.send(data, socketIndex);
        output.disconnect(socketIndex);
    }
}

function nextSocketIndex(self) {
    var output = self.outPorts.output;
    var attached = output.listAttached();
    if (_.isEmpty(attached)) return null;
    do {
        self.socketId = (_.isFinite(self.socketId) ? ++self.socketId : 0) % ( _.max(attached) + 1);
    } while (attached.indexOf(self.socketId) < 0);
    return self.socketId;
}
