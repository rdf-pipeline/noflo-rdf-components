/**
 * lm.js
 *
 * This file contains the code used to create an lm object.
 */

globalLm = { timestamp: Date.now(),  
             counter: 0 };

module.exports = {

  /**
   * Get a special last modified timestamp that will have the millicseconds
   * since 1970 plus a counter that guarantees uniqueness on each call, even
   * if the number of milliseconds has not changed (counter will increment to
   * force uniqueness.
   */
  Lm: function() {

    var lm = { timestamp: Date.now(),  
               counter: 0 };

    // Does my new lm have a different timestamp from the last one?
    if (lm.timestamp === globalLm.timestamp) {
      // Got identical timestamps - increment the counter
      lm.counter = ++globalLm.counter;
    } else {
      // Different timestamps.  We can set the globalLm to the current Lm values
      // so the next time we get called, we know what we last had
      globalLm = { timestamp: lm.timestamp, 
                   counter: 0};
    }
   
    return lm;
  }

};

