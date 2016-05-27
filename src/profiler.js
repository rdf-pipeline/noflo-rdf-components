// profiler.js

var _ = require('underscore');

var fs = require('fs');
var logger = require('simple-node-logger');
var util = require('util');

module.exports = function(node) { 

    _.extend(node, 
        {
          profiler: {
              createLog: function(path, filename) { 

                  this.profileLog = logger.createRollingFileLogger({
                      domain: node.componentName,
                      category: 'rdf-pipeline',
                      logDirectory: path,
                      fileNamePattern: filename,
                      dateFormat:'YYYY.MM.DD'
                  });

                  var appender = this.profileLog.getAppenders()[0];
                  appender.formatter = function(entry) {
                      var fields = appender.formatEntry(entry);
                      fields[1] = entry.level;
                      fields[2] = process.pid + ':' + node.componentName + ':' + node.nodeName+':';
                      var results = fields.toString().replace(/,/g,' ') + '\n';
                      return results;
                  };
              },

              metrics: {
                  numberOfErrors: 0,
                  numberOfUpdates: 0,
                  startTime: Date.now(),
                  totalErrorTime: 0,
                  totalUpdateTime: 0
              },

              update: function(startTime, isSuccess, message) { 
                  var time = Date.now() - startTime;
                  if (isSuccess) {
                      this.metrics.numberOfUpdates++;
                      this.metrics.totalUpdateTime += time;
                      this.profileLog.info('Update completed successfully with elapsedTime: ',String(time),'ms');
                      var avg = String(Math.round(this.metrics.totalUpdateTime/this.metrics.numberOfUpdates));
                      this.profileLog.info('Average update time: ',avg,'ms');
                  } else {
                      this.metrics.numberOfErrors++;
                      this.metrics.totalErrorTime += time;
                      this.profileLog.info('Update failed with an error - elapsedTime: ',String(time),'ms');
                      this.profileLog.error(message);
                  }

                  var total = String(Date.now() - this.metrics.startTime);
                  this.profileLog.info('Total component elapsed time: ',total,'ms');

                  var name = node.nodeName || node.componentName;
                  this.metrics.totalElapsedTime = Date.now() - this.metrics.startTime;
                  fs.writeFile(__dirname+'/../metrics/'+name+'.txt', 
                               'Started: '+ timeStamp(this.metrics.startTime) + 
                               util.inspect(this.metrics) + 
                               '\nWritten: ' + timeStamp());
              } 
         } 
    }); // extend
} // module export

function timeStamp(date) { 
    var date = _.isUndefined(date) ? new Date() : new Date(date);
    return date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + (date.getDate() + 1)).slice(-2) + ' ' +  
           date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + '\n';
}
