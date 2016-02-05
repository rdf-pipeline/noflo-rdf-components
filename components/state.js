// State.js

var Lm = require('./Lm');

// Returns the vni associated with the specified vnid.
module.exports = function( data, lm ) { 

       var stateLm = lm || Lm();
       return { data: data, 
                lm: stateLm };
};
