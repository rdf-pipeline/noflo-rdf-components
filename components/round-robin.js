// round-robin.js

var _ = require('underscore');
var noflo = require('noflo');

exports.getComponent = function() {
    return _.extend(new noflo.Component({
        outPorts: {
            out: {
                description: "Only one socket will receive each group of data packets",
                datatype: 'all'
            }
        },
        inPorts: {
            'in': {
                description: "Each input group is send to exactly one output socket",
                datatype: 'all',
                required: true,
                process: on({
                    begingroup: begingroup,
                    data: send,
                    endgroup: endgroup
                })
            }
        }
    }), {
        description: "Every group of data packet will be sent to at most one out-port socket",
        icon: 'refresh'
    });
};

function on(type, callback) {
    return function(event, payload) {
        if (type[event]) type[event].call(this.nodeInstance, payload);
    };
}

function begingroup(group){
    this.groupPort = nextSocket(this);
    onceConnected(this.groupPort, function(socket){
        socket.beginGroup(group);
    });
}

function send(data) {
    var disconnect = !this.groupPort;
    onceConnected(this.groupPort || nextSocket(this), function(socket){
        socket.send(data);
        if (disconnect) {
            socket.disconnect();
        }
    });
}

function endgroup() {
    onceConnected(this.groupPort, function(socket){
        socket.endGroup();
        socket.disconnect();
    });
    this.groupPort = null;
}

function onceConnected(socket, callback) {
    if (!socket) return;
    else if (socket.isConnected()) return callback(socket);
    socket.once('connect', callback.bind(this, socket));
    socket.connect();
}

function nextSocket(self) {
    var sockets = self.outPorts.out.sockets;
    self.socketId = (_.isFinite(self.socketId) ? 1 + self.socketId : 0) % sockets.length;
    return sockets[self.socketId];
}
