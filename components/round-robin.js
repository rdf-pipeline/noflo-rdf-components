// round-robin.js

var _ = require('underscore');
var noflo = require('noflo');

var basenode = require('../src/base-node');

exports.getComponent = function() {
    return _.extend(new noflo.Component({
        outPorts: {
            out: {
                description: "Only one socket will receive each data packet",
                datatype: 'all'
            }
        },
        inPorts: {
            'in': {
                description: "Each input group is send to exactly one output socket",
                addressable: true,
                datatype: 'all',
                required: true,
                process: basenode.on({data: send})
            }
        }
    }), {
        description: "Every data packet will be sent to at most one out-port socket",
        icon: 'refresh'
    });
};

function send(data, socketIndex) {
    nextSocket(this).then(function(socket){
        socket.send(data);
        socket.disconnect();
    });
}

function nextSocket(self) {
    var sockets = self.outPorts.out.sockets;
    self.socketId = (_.isFinite(self.socketId) ? ++self.socketId : 0) % sockets.length;
    var socket = sockets[self.socketId];
    if (socket) return Promise.resolve(socket);
    else return Promise.reject(Error("No attached output sockets"));
}
