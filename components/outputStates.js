// outportStates.js

var _ = require('underscore');
var Lm = require('./Lm');

var outportStates = [];

// Returns the vni associated with the specified vnid.
module.exports = function( outportName, newState ) { 
 
   if ( arguments.length === 1 ) { 
       if ( _.isUndefined( outportStates[outportName] ) ) { 
           return;
       } 
       return outportStates[outportName];
   }

   if ( arguments.length === 2 ) { 
       outportStates[outportName] = { lm: Lm(),
                                      data: newState };
       return this;
   }
};
