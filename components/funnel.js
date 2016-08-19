// funnel.js

var _ = require('underscore');
var fs = require('fs');

var stateFactory = require('../src/create-state.js');
var logger = require('../src/logger.js');
var wrapper = require('../src/javascript-wrapper.js');

module.exports = wrapper(funnel);

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
    var metadataKey = _.isEmpty(metadata_key) ? 'funnelId' : metadata_key;
    if (!_.isString(metadataKey)) throw Error('Funnel requires a metadata key string!'); 

    if (_.isString(input)) 
        console.log('\nenter funnel with input:',input);
    else 
        console.log('\nENTER FUNNEL WITH NON-STRING INPUT',input);

    // Initialize the funnel state in node instance the first time through
    if (_.isUndefined(node.funnel)) {
        node['funnel'] = {};
        node.funnel.executed = 0;
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
       funnel.executed++;
       if (funnel.queue.length > 0) { 
           // get the next one from the queue
           funnel.executing =  funnel.queue.shift();
           stateFactory.clearMetadata(this.outputState());
           this.outputState({[metadataKey]: funnel.executing});
           console.log('\n********************************************************************\n'+
                       'Completed execution ' + funnel.executed +' ids\n' +
                       'funnel sending:', funnel.executing, 
                       '\n' + funnel.queue.length + ' ids in the queue' +
                       '\nfunnel queue:',funnel.queue,
                       '\n********************************************************************\n');
           logger.info('Processing id:',funnel.executing);
           return funnel.executing;

        } else {
           funnel.executing = '';
           var elapsedTime = msToString(Date.now() - funnel.startTime);
           logger.warn('\n********************************************************************\n'+
                       'Completed execution ' + funnel.executed +' ids\n' +
                       'Nothing left in funnel.  Elapsed time: ' + elapsedTime +
                       '\n********************************************************************\n');
        }

    } else if (_.isEmpty(funnel.executing) && !_.isEmpty(funnelInput)) {

           funnel.executing = funnelInput;
           console.log('\n********************************************************************\n'+
                       'Completed execution '+ funnel.executed +' ids\n' +
                       'funnel sending:', funnel.executing, 
                       '\n' + funnel.queue.length + ' ids remaining in the queue' +
                       '\nfunnel queue:',funnel.queue,
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
               console.log('funnel saved input to queue.  Funnel:',funnel);
           } 
       }
    } 
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
