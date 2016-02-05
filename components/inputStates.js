// inputStates.js

var _ = require('underscore');
var Lm = require('./Lm');

var inputStates = [];

// Returns the vni associated with the specified vnid.
module.exports = function( inportName, sourceNodeName, sourcePortName, newState ) { 
 
   if ( arguments.length === 1 || arguments.length === 3 ) { 
       return inputStates[inportName];
   }

   if ( arguments.length === 2 || arguments.length === 4 ) { 
       inputStates[inportName] = { data: arguments[arguments.length-1].data,
                                   lm: arguments[arguments.length-1].lm };
       // Will handle sourceNodeName and sourcePortName here in a future sprint
       return this;
   }
};
