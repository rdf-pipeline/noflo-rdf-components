// State.js

var Lm = require('./Lm');

// Returns the vni associated with the specified vnid.
module.exports = function( data ) { 

       return { data: data, 
                lm: Lm() };
};
