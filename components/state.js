// state.js

var _ = require('underscore');

var Lm = require('./Lm');

var states = [];

// Returns the vni associated with the specified vnid.
module.exports = function( inportName, sourceNodeName, sourcePortName, newState ) { 
 
   if ( arguments.length === 1 || arguments.length === 3 ) { 
       if ( _.isUndefined( states[inportName] ) ) { 
           return;
       } 
       return states[inportName];
   }

   if ( arguments.length === 2 || arguments.length === 4 ) { 
       states[inportName] = { data: arguments[arguments.length-1],
                              lm: Lm(),
                              previousLms: [],
                              port: inportName };
       return this;
   }
};
