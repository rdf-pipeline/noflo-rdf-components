/**
 * lm.js
 *
 * This file contains the code used to create, serialize, deserialize, and compare
 * a last modified (LM) object. For more information about RDF pipeline LMs, please 
 * refer to https://github.com/rdf-pipeline/framework/wiki/LM
 */

var _ = require('underscore');

globalLm = { timestamp: Date.now(),  
             counter: 0 };

/**
 * Get a special last modified timestamp that will have the millicseconds
 * since 1970 plus a counter that guarantees uniqueness on each call, even
 * if the number of milliseconds has not changed (counter will increment to
 * force uniqueness.
 *
 * @param string optional string LM
 *
 * @return new LM is no lm string or a deserialized Lm built from the 
 *         string if a good Lm string was given
 */
function Lm( string ) { 

   // If we get an LM string, parse & validate it
   var components = (string) ? arguments[0].match(/LM(\d+)\.(\d+)/) : null;
   if ( components && 
      (( ! _.isArray( components ) ) || components.length !== 3)) { 
      throw new Error('Invalid Lm format on argument ',arguments[0]);
   }
  
   if ( components ) { 
      // Construct LM from the string components
      this.timestamp = Number( components[1] );
      this.counter = Number( components[2] );

   } else { 

      // Construct LM from scratch 
      this.timestamp = Date.now();
      this.counter = 0;

       // Does my new lm have a different timestamp from the last one?
       if (this.timestamp === globalLm.timestamp) {
           // Got identical timestamps - increment the counter
           this.counter = ++globalLm.counter;
       } else {
          // Different timestamps.  We can set the globalLm to the current Lm values
          // so the next time we get called, we know what we last had
          globalLm = { timestamp: this.timestamp, 
                       counter: 0};
        }
   }
}

/**
 * The toString API for an LM converts the Javascript object representation to 
 * a fixed-length string, such as: LM1328113669.00000000000000001
 * where the number before the decimal point is the timestamp value, and
 * the digits after the decimal point represent the counter.  
 */
var MAX_DIGITS = (Number.MAX_SAFE_INTEGER.toString().split('')).length;
Lm.prototype.toString =  function() {
    var counter = this.counter.toString();
    return 'LM'+this.timestamp+'.'+Array(MAX_DIGITS-counter.length+1).join("0") + counter;
}

Lm.prototype.valueOf =  function() {
    var counter = this.counter.toString();
    return this.timestamp+'.'+Array(MAX_DIGITS-counter.length+1).join("0") + counter;
}

/**
 * construct an LM either from scratch or from the specified LM string 
 */
module.exports = function( string ) {

    if ( arguments.length > 1 ) { 
        throw new Error('Lm constructor expects at most one Lm string argument!');
    }

    return new Lm( string );
};
