// inportStates.js

var _ = require('underscore');
var Lm = require('./Lm');

var inportStates = [];

// Returns the vni associated with the specified vnid.
module.exports = function( inportName, sourceNodeName, sourcePortName, newState ) { 
 
   if ( arguments.length === 1 || arguments.length === 3 ) { 
       if ( _.isUndefined( inportStates[inportName] ) ) { 
           return;
       } 
       return inportStates[inportName];
   }

   if ( arguments.length === 2 || arguments.length === 4 ) { 
       inportStates[inportName] = { data: arguments[arguments.length-1],
                                    lm: Lm(),
                                    port: null  };
       return this;
   }
};
