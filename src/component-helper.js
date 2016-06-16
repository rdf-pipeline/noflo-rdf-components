// component-helper.js

/**
 * This file contacts the helper functions that may be used by any pipeline component
 */

var _ = require('underscore');

var path = require('path');
var stackTrace = require('stack-trace');

var createLm = require('../src/create-lm');

module.exports = {

    // Turns on debug instrumentation across all of the RDF pipeline components
    debugAll: false,

    /** 
     * Gets the current component node name and component name in a nice readable format
     * for debug traces
     *
     * @param nodeInstance
     * @return a summary of the file, function, node name, and component name that
     *         is executing with a structure like this: 
     *              file.js - function() for nodeName(componentName)
     *         If there is no node name or component name, they will be omitted.
     */
    formattedNodeName: function(nodeInstance) {

        var frame = stackTrace.get()[1];
        var fct = frame.getFunctionName() || 'module.exports';
        var caller = path.basename(frame.getFileName()) + ' - '+ fct +'()';

        if (_.isUndefined(nodeInstance)) { 
            return caller;
        }

        var nodeName = nodeInstance.nodeName || '';
        var compName = nodeInstance.compName || '';
        return (compName.length + nodeName.length === 0) ? caller : 
               caller + ' for '+ nodeInstance.nodeName + '(' + nodeInstance.componentName + ')';
    },

    /**
     * Updates the output state LM to a more recent timestamp.
     * This is useful when a component updater has already handled sending
     * state and does not want the pipeline framework to do it.
     *
     * @param vni
     */
    refreshOutputLm: function(vni) { 
        var outputState = vni.outputState();
        outputState.lm = createLm();
        vni.outputState(outputState);
    }

};

