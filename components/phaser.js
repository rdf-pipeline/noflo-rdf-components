// phaser.js

var _ = require('underscore');

var promiseOutput = require('../src/promise-output');
var componentFactory = require('../src/noflo-component-factory');

/**
 * A barrier that queues its input until all registered parties have arrived
 */
module.exports = componentFactory({
    description: "A barrier that queues its input until all registered parties have arrived",
    outPorts: promiseOutput.outPorts,
    inPorts: {
        register: {
            description: "Increase the count value",
            datatype: 'bang',
            ondata: register
        },
        arrive: {
            description: "Decrement the count value",
            datatype: 'bang',
            ondata: arrive
        },
        input: {
            description: "Data to be repeated in the output",
            datatype: 'all',
            ondata: promiseOutput(advance)
        }
    }
});

function register() {
    this.nodeInstance.count = (this.nodeInstance.count || 0) + 1;
}

function arrive() {
    this.nodeInstance.count = (this.nodeInstance.count || 0) - 1;
}

function advance(value) {
    if (!this.nodeInstance.queue) {
        this.nodeInstance.queue = [];
    }
    this.nodeInstance.queue.push(value);
    if (!(this.nodeInstance.count > 0)) { // all parties have arrived
        try {
            return this.nodeInstance.queue;
        } finally {
            this.nodeInstance.queue = [];
        }
    }
}
