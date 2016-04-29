// component-helper.js

/**
 * This file contacts the helper functions that may be used by any pipeline component
 */

var _ = require('underscore');

var createLm = require('../src/create-lm');

module.exports = {

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

