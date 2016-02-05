// outputStates.js

var _ = require('underscore');
var Lm = require('./Lm');
var State = require('./state');

var outputStates = [];

// Returns the vni associated with the specified vnid.
module.exports = function( outportName, newState ) { 
 
   if ( arguments.length === 1 ) { 
       return outputStates[outportName];
   }

   if ( arguments.length === 2 ) { 
       outputStates[outportName] = newState;
       return this;
   }
};
