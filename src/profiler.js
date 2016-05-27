// profiler.js

var _ = require('underscore');

/**
 * This RDF Pipeline component profiler gathers metrics on the processing time for each
 * component and records them in the specific metrics directory.  The sequence of execution
 * is also logged if createLog is called to enable logging. 
 *
 * @param node the RDF pipeline component facade
 */
module.exports = function(node) { 

    _.extend(node, 
        {
          profiler: {
              metrics: {
                  averageUpdateTime: 0,
                  numberOfErrors: 0,
                  numberOfEvents: 0,
                  numberOfUpdates: 0,
                  startTime: Date.now(),
                  totalErrorTime: 0,
                  totalProcessingTime: 0,
                  totalUpdateTime: 0
              },

              eventTypes: {
                  ONDATA_EVENT: 1,
                  UPDATE_SUCCESS: 2,
                  UPDATE_ERROR: 3
              },

              update: function(startTime, eventType) { 
                   var time = Date.now() - startTime + 1; // ensure we get at least 1 ms
                   this.metrics.numberOfEvents++;

                   switch(eventType) { 
                       case this.eventTypes.ONDATA_EVENT: {
                           // already incremented event count, so nothing more to do
                           break;
                       }
                       case this.eventTypes.UPDATE_SUCCESS: {
                           this.metrics.numberOfUpdates++;
                           this.metrics.totalUpdateTime += time;
                           this.metrics.averageUpdateTime = 
                               Math.round(this.metrics.totalUpdateTime/this.metrics.numberOfUpdates);
                           break;
                       }
                       case this.eventTypes.UPDATE_ERROR: {
                           this.metrics.numberOfErrors++;
                           this.metrics.totalErrorTime += time;
                           break;
                       }
                       default: throw Error('Profiler update received unknown event type!');
                   }
                   this.metrics.totalProcessingTime += time;
              } 
         } // profiler
    }); // extend
} // module export
