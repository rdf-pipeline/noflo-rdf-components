// read-content.js

var _ = require('underscore');
var path = require('path');
var fs = require('fs');

var promiseOutput = require('../src/promise-output');
var componentFactory = require('../src/noflo-component-factory');

/**
 * Receives a filename (relative to this module) on the filename port, and sends the contents of the specified file to the output port. In case of errors the error message will be sent to the error port.
 */
module.exports = componentFactory({
    description: "Receives a filename (relative to this module) on the filename port, and sends the contents of the specified file to the output port. In case of errors the error message will be sent to the error port.",
    outPorts: promiseOutput.outPorts,
    inPorts: {
        encoding: {
            description: "Character encoding",
            datatype: 'string',
            default: 'utf-8',
            ondata: function(encoding){
                this.nodeInstance.encoding = encoding;
            }
        },
        filename: {
            description: "Filename (absolute or relative to this module)",
            datatype: 'string',
            required: true,
            ondata: promiseOutput(readFile)
        }
    }
});

function readFile(filename) {
    var absolute = path.resolve(__dirname, '..', filename);
    var encoding = this.nodeInstance.encoding || 'utf-8';
    return new Promise(function(resolve, reject){
        return fs.readFile(absolute, encoding, function(err, content){
            if (err) reject(err);
            else resolve(content);
        });
    });
}
