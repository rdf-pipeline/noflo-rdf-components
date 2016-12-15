// funnel.js

var _ = require('underscore');

var fs = require('fs');
var os = require('os');

var stateFactory = require('../src/create-state.js');
var format = require('../src/format.js');
var logger = require('../src/logger.js');
var profiler = require('../src/profiler.js');
var wrapper = require('../src/javascript-wrapper.js');

module.exports = wrapper({description: "Builds a queue of input, and feeds each input, " +
                                       "one at a time through the funnel, waiting for a " +
                                       "completion signal before sending the next one.",
                          isTransient: true,
                          icon: "filter",
                          updater: funnel});

/**
 * Funnels a single input into the pipeline one at a time, and queues the rest
 * Fires the next one when it receives the id that has just finished executing.
 * WARNING: This will only work when the input is guaranteed to be unique, i.e., 
 * never receiving the same ID more than once. When possible, it should be modified to 
 * better distinguish between the two port connections, perhaps by sniffing the data 
 * to distinguish them.
 *
 * @param input Either an id, to be queued and sent to the output when it is its turn.
 *              The input value will be stored as a patientId attribute in the VNI 
 *              metadata, which will be passed to all nodes down stream.  The input 
 *              port is NOT multi - to work properly, it is expected to have two inputs: 
 *                 - the input edge that feeds in one or more id values
 *                 - an input edge that returns the id value when it has finished 
 *                   downstream processing and the next id should be sent through the funnel.
 *              This code will need to be changed if the pipeline is modified to disallow multi.
 *
 * @param metadata_key a key name that will be used to create metadata on the VNI to send downstream.
 *                     In the LPI RDF Pipeline, this would be patientId, but it could be any 
 *                     name the pipeline builder wishes to use.  If it is empty, the key name 
 *                     funnelId will be used.
 */
function funnel(input, metadata_key) {

    var node = this.nodeInstance;
    var pipelineMetrics = profiler.pipelineMetrics;

    var metadataKey = _.isEmpty(metadata_key) ? 'funnelId' : metadata_key;
    if (!_.isString(metadataKey)) throw Error('Funnel requires a metadata key string!'); 

    if (_.isString(input)) 
        logger.info('\nenter funnel with input:',input);
    else 
        logger.info('\nENTER FUNNEL WITH NON-STRING INPUT',input);

    // Initialize the funnel state in node instance the first time through
    if (_.isUndefined(node.funnel)) {
        node['funnel'] = {};
        node.funnel.executed = [];
        node.funnel.queue = []; 
        node.funnel.executing = '';
        node.funnel.startTime = Date.now();
    }

    var funnel = node.funnel;
    var funnelInput = input;

    // Input coming over http will have extraneous leading and trailing quotes embedded - remove 'em
    if (!_.isEmpty(funnelInput)) {
        if (_.isString(funnelInput) && funnelInput.charAt(0) === '"' && funnelInput.charAt(input.length -1) === '"') 
            funnelInput = funnelInput.substr(1, funnelInput.length -2);
    }

    if (funnel.executing === funnelInput) { 

       // Just finished executing - ready for the next one
       logger.info('Completed processing id:',funnel.executing);
       funnel.executed.push(funnel.executing);
       if (funnel.queue.length > 0) { 
           // get the next one from the queue
           funnel.executing =  funnel.queue.shift();
           stateFactory.clearMetadata(this.outputState());
           this.outputState({[metadataKey]: funnel.executing});
           logger.info('\n********************************************************************\n'+
                       'Completed execution ' + _.keys(funnel.executed).length +' ids\n' +
                       'funnel sending:' + funnel.executing +
                       '\n' + funnel.queue.length + ' ids in the queue' +
                       '\nfunnel queue:' + funnel.queue +
                       '\n\nTotal VNIs: ' + pipelineMetrics.totalVnis +
                       '\nDefault VNIs: ' + pipelineMetrics.totalDefaultVnis +
                       '\n\nMemory Usage (free/total): ' + format.bytesToMb(os.freemem()) + '/' + format.bytesToMb(os.totalmem()) +
                       '\n********************************************************************\n');
           return funnel.executing;

        } else {
           funnel.executing = '';
           var elapsedTime = msToString(Date.now() - funnel.startTime);
           logger.info('\n********************************************************************\n'+
                       'Completed execution ' + _.keys(funnel.executed).length +' ids\n' +
                       'Nothing left in funnel.  Elapsed time: ' + elapsedTime +
                       '\n\nTotal VNIs: ', pipelineMetrics.totalVnis, 
                       '\nDefault VNIs: ', pipelineMetrics.totalDefaultVnis,
                       '\n\nMemory Usage (free/total): ' + format.bytesToMb(os.freemem()) + '/' + format.bytesToMb(os.totalmem()) +
                       '\n********************************************************************\n');
        }

    } else {

        if (inQueue(funnelInput, funnel.queue)) {
            logger.warn('Already queued ',funnelInput);
            return;
        }

        if (inQueue(funnelInput, funnel.executed)) { 
            logger.warn('Already processed ',funnelInput);
            return;
        }


        if (_.isEmpty(funnel.executing) && !_.isEmpty(funnelInput)) {
           // Nothing executing right now, and we do have new input, so execute it

           funnel.executing = funnelInput;
           logger.info('\n********************************************************************\n'+
                       'Completed execution '+ _.keys(funnel.executed).length +' ids\n' +
                       'funnel sending:' + funnel.executing +
                       '\n' + funnel.queue.length + ' ids remaining in the queue' +
                       '\nfunnel queue:' + funnel.queue + 
                       '\n\nTotal VNIs: ' + pipelineMetrics.totalVnis +
                       '\nDefault VNIs: ' + pipelineMetrics.totalDefaultVnis +
                       '\n\nMemory Usage (free/total): ' + format.bytesToMb(os.freemem()) + '/' + format.bytesToMb(os.totalmem()) +
                       '\n********************************************************************\n');
           logger.info('Processing id:',funnel.executing);
           stateFactory.clearMetadata(this.outputState());
           this.outputState({[metadataKey]: funnel.executing});
           return funnel.executing;

        } else {

            // Already have something else executing so queue this input request
            if (!_.isEmpty(funnelInput)) { 
                if (-1 === _.indexOf(funnel.queue, funnelInput)) {
                    funnel.queue.push(funnelInput);
                    logger.info('funnel saved input to queue.  Funnel:',funnel);
                } 
            }
        }
    } 
}

function inQueue(input, queue) { 
    var queued = _.find(queue, function(current) {
        return current === input;
    });  

    return !_.isUndefined(queued);
}

/**
 * Given a time in milliseconds, generate a human readable string 
 * breaking it into days, hours, minutes, seconds.
 */
function msToString(ms) {
    var seconds = ms/1000;
    var days = Math.floor((seconds % 31536000) / 86400); 
    var hours = Math.floor(((seconds % 31536000) % 86400) / 3600);
    var minutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
    var seconds = (((seconds % 31536000) % 86400) % 3600) % 60;
    return days + " days " + hours + " hours " 
                   + minutes + " minutes " + seconds + " seconds";
}
