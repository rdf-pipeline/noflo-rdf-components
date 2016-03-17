// object.js

var _ = require('underscore');

var promiseOutput = require('../src/promise-output');
var componentFactory = require('../src/noflo-component-factory');

/**
 * Creates a object from a key and value or a series of keys and a series of values
 */
module.exports = componentFactory({
    description: "Creates a object from a key and value or a series of keys and a series of values",
    outPorts: promiseOutput.outPorts,
    inPorts: {
        key: {
            description: "Property key",
            datatype: 'string',
            required: true,
            onconnect: function() {
                this.nodeInstance.keys = [];
            },
            ondata: function(key) {
                if (key != null) {
                    this.nodeInstance.keys.push(key);
                }
            },
            ondisconnect: promiseOutput(createObject)
        },
        value: {
            description: "Property value",
            datatype: 'all',
            required: true,
            onconnect: function() {
                this.nodeInstance.values = [];
            },
            ondata: function(value) {
                this.nodeInstance.values.push(value);
            },
            ondisconnect: promiseOutput(createObject)
        }
    }
});

function createObject() {
    var keys = this.nodeInstance.keys;
    var values = this.nodeInstance.values;
    if (!_.isEmpty(keys) && !_.isEmpty(values))
        return _.object(keys, values);
}
