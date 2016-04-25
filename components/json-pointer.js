// json-pointer.js

var _ = require('underscore');
var jsonpointer = require('jsonpointer');

var promiseOutput = require('../src/promise-output');
var componentFactory = require('../src/noflo-component-factory');

/**
 * Takes the value of the get pointer for some input and sets that value on the
 * input at the set pointer. If there is not set pointer provided, this will
 * return the get pointer value, otherwise it will return the input object.
 */
module.exports = componentFactory({
    description: "Takes the value of the get pointer for some input and sets that value on the input at the set pointer. If there is not set pointer provided, this will return the get pointer value, otherwise it will return the input object.",
    outPorts: promiseOutput.outPorts,
    inPorts: {
        get: {
            description: "JSON Pointer path for the value to set",
            datatype: 'string',
            ondata: function(pointer) {
                this.nodeInstance.getPath = pointer;
            }
        },
        set: {
            description: "JSON Pointer path of the place to set",
            datatype: 'string',
            ondata: function(pointer) {
                this.nodeInstance.setPath = pointer;
            }
        },
        input: {
            description: "Object to be modified",
            datatype: 'all',
            ondata: promiseOutput(modify)
        }
    }
});


function modify(input) {
    var value = jsonpointer.get(input, this.nodeInstance.getPath);
    if (this.nodeInstance.setPath) {
        jsonpointer.set(input, this.nodeInstance.setPath, value);
        console.log(value);
        return input;
    } else {
        return value;
    }
}
