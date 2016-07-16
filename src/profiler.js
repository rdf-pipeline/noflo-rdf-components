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
                  numberOfUpdates: 0,
                  averageUpdateTime: 0,
                  totalUpdateTime: 0,
                  numberOfErrors: 0,
                  averageErrorTime: 0,
                  totalErrorTime: 0,
                  numberOfEvents: 0,
                  averageEventTime: 0,
                  totalEventTime: 0,
                  startTime: Date.now(),
                  totalProcessingTime: 0
              },

              startEvent: function() {
                  return Date.now();
              },
 
              stopEvent: function(eventStart) { 
                  var stoptime = Date.now() - eventStart;

                  this.metrics.numberOfEvents++;
                  this.metrics.totalEventTime += stoptime;
                  this.metrics.averageEventTime = 
                      Math.round(this.metrics.totalEventTime/this.metrics.numberOfEvents);

                  this.metrics.totalProcessingTime += stoptime;
              },

              startUpdate: function() {
                  return Date.now();
              },

              stopUpdate: function(updateStart, isError) {
                  var stoptime = Date.now() - updateStart;

                  if (isError) { 
                      this.metrics.numberOfErrors++;
                      this.metrics.totalErrorTime += stoptime;
                      this.metrics.averageErrorTime = 
                          Math.round(this.metrics.totalErrorTime/this.metrics.numberOfErrors);
                  } else {
                      this.metrics.numberOfUpdates++;
                      this.metrics.totalUpdateTime += stoptime;
                      this.metrics.averageUpdateTime = 
                          Math.round(this.metrics.totalUpdateTime/this.metrics.numberOfUpdates);
                  }

                  this.metrics.totalProcessingTime += stoptime;
              }
         } // profiler
    }); // extend
} // module export
