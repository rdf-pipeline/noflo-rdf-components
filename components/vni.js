// vni.js

var _ = require('underscore');

var inputStates = require('./inputStates');
var outputStates = require('./outputStates');

// Hash of vnis
vnis = []; 


// Returns the vni associated with the specified vnid.
module.exports = function( vnid ) { 
 
        if ( _.isUndefined( vnis[vnid] ) ) {
           // Create Vni for real here
        }

        return {
            inputState: inputStates,
            outputState: outputStates.bind(this, 'output'),
            errorState: outputStates.bind(this, 'error')
        };
};
