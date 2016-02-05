// outputStates.js

var _ = require('underscore');
var Lm = require('./Lm');
var State = require('./state');

var outputStates = [];

// Returns the vni associated with the specified vnid.
module.exports = function( outportName, data ) { 
 
   if ( arguments.length === 1 ) { 
       return outputStates[outportName];
   }

   if ( arguments.length === 2 ) { 
       outputStates[outportName] = State( data );
       return this;
   }
};
