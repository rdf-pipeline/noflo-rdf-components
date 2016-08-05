// logger.js

var path = require('path');
var _ = require('underscore');
var winston = require('winston');
var stackTrace = require('stack-trace');

/**
 * Creates a custom logger for this package
 */
module.exports = new winston.Logger({
    transports: [
        new winston.transports.Console({
            name: 'console',
            level: 'warn',
            colorize: true
        }),
        new winston.transports.File({
            name: 'rdf-components',
            filename: 'rdf-components.log',
            level: 'info'
        })
    ]
});

module.exports.rewriters.push(function(level, msg, meta) {
    if (!meta.nodeInstance) return meta;
    var obj = meta.nodeName || meta.inputStates ? {} : _.clone(meta);
    var frame = stackTrace.get()[5];
    var functionName = frame.getFunctionName();
    var filename = path.basename(frame.getFileName());
    return _.omit(_.extend(obj, {
        source: filename,
        caller: functionName,
        node: meta.nodeInstance.nodeName,
        comp: meta.nodeInstance.componentName,
        nodeInstance: null
    }), _.negate(Boolean));
});
