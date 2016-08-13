// confluence.js

var _ = require('underscore');

var util = require('util');
var logger = require('../src/logger');
var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper(updater);

/**
 * Similar to a join, confluence allows for synchronizing the completion of multiple inputs.  It takes
 * a hash with one task per hash entry that should be waited on.  Each hash entry is initially marked 
 * pending. As input comes in (with a metadata key on the VNI identifying associated the hash task), 
 * the pending flag is removed.   When all hash entries are no longer pending, confluence will return
 * a string that indicates it is complete.
 *
 * This version of confluence supports the processing of only one hash at a time.  It will throw
 * an error if it receives a new hash before the last one has completed.
 * 
 * @this vni context
 *
 * @param hash a hash of outstanding tasks to be completed
 * @param input the input port to which all edges should be attached.  This port must NOT be multi
 * @param metadata_key metadata attribute name holding a value that links the input with the hash entry
 *                     to indicate all data for that hash entry has been processed.  Defaults to patientId
 * 
 * @return a completion string
 */
function updater(hash, input, metadata_key) {

   if (_.isEmpty(hash) || !_.isObject(hash)) throw Error("Confluence requires a hash to synchronize the inputs!");

   if (_.isEmpty(metadata_key) || !_.isString(metadata_key)) {
       logger.warn("No metadata key found; defaulting metadata key to patientId.");
       metadata_key = 'patientId';
   }

   // Get the hash's metadata key value - this is the overall work id e.g, a patientId
   var hashState = this.inputStates('hash'); 
   var hashId = hashState[metadata_key]; 
   if (invalidKeyValue(hashId)) {
       throw Error('Confluence requires a metadata key on the hash VNI to identify the task set being processed!');
   }

   // Get the input parameter's input state and this particular completed task id. 
   // This id might be an id for a patient procedure or description
   var inputState = this.inputStates('input');
   if (_.isUndefined(inputState)) return;  // have hash but no input - wait for input
   var inputId = inputState[metadata_key];
   if (invalidKeyValue(inputId)) {
       throw Error('Confluence requires a metadata key on the input VNI to identify the completed task!');
   }

   // Create a place in the node instance to keep track of our state between calls to this component
   this.nodeInstance.confluence = this.nodeInstance.confluence || {completed: []};
   var confluence = this.nodeInstance.confluence;

   // Is this input for a hash tha was already completed?
   if (_.indexOf(confluence.completed, inputId) != -1) {
       // Got a late message for a patient we finished with already
       logger.warn('\nAlready processed ',inputId,'; completed Ids:',confluence.completed,'\n');
       return;
   }

   // If we have a completion hash, make sure the key matches the hashId we just received
   if (!_.isUndefined(confluence.completionHash)) {
      if (confluence.completionHash.key !== hashId) {
          throw Error('Confluence received a new hash before the last one was finished!');
      }
   }

   // If we have no completion hash yet, or the hash is newer than the input
   if (_.isUndefined(confluence.completionHash) || hashState.lm > inputState.lm) {
       // Create a copy of the hash in the nodeInstance and set the pending
       // flag on each hash entry to true, indicating we have not received the data yet.
       var parsedHash = (_.isString(hash)) ? JSON.parse(hash) : hash;
       confluence.completionHash = _.mapObject(parsedHash, function(val, keyname) {
            if (_.isObject(val))
                return _.extend(val, {pending:true}); 
            else 
                return {[keyname]: val, pending:true}; 
       });
       confluence.completionHash.key = hashId;

       // Now that we have the hash, do we have any pending input to apply?
       // This would be from inputs received before we received the hash
       if (!_.isUndefined(confluence.pendingInput)) {
           logger.debug('\nGOT PENDING INPUT DATA:',confluence.pendingInput);
           confluence.pendingInput.forEach(function(vnid) { 
               logger.debug('\napplying pending data for ',vnid);
               if ((!_.isUndefined(confluence.completionHash[vnid])) && 
                   !_.isUndefined(confluence.completionHash[vnid].pending)) {
                   delete confluence.completionHash[vnid].pending;
               } else logger.debug("VNID",vnid,"IS NOT IN HASH!");

           });
           confluence.pendingInput = undefined;
       } 

       logger.debug('INITIALIZED COMPLETION HASH to ',confluence.completionHash);
   }

   // Does the input id we received match the hash hash Id? 
   if ((!_.isUndefined(inputId)) && hashId !== inputId) { 
        logger.info('INPUT & HASH DO NOT MATCH');

        // If input state is newer than the hash, save it so we can apply it when the new hash is received.
        if (inputState.lm > hashState.lm) {
           confluence.pendingInput = confluence.pendingInput || [];
           confluence.pendingInput.push(inputState.vnid);
           logger.debug('\nBUILT PENDING INPUT:', confluence.pendingInput,'\n');
           return; // we are done since this input has no matching hash yet
        }
   }

   // Remove pending flag if we have received the input vnid indicating this record was processed.
   if ((!_.isUndefined(confluence.completionHash[inputState.vnid])) && 
       (!_.isUndefined(confluence.completionHash[inputState.vnid].pending))) {
           logger.info('CLEAR Pending Flag for ',inputState.vnid);
           delete confluence.completionHash[inputState.vnid].pending;
   } else {
       logger.info('Vnid',inputState.vnid,'is not pending.');
   }

   // If we have received confirmation that each item in the hash was processed (there are no more pendings)
   if (haveAll(confluence.completionHash)) {
       // Record the hash ID and clear the hash
       confluence.completed.push(hashId);
       confluence.completionHash = undefined;
       logger.info('\n******************************************************************\n'+
                   'EXIT CONFLUENCE WITH COMPLETE HASH FOR '+hashId+'!'+ 
                   '\n******************************************************************\n');
       return 'Completed processing ' + hashId;
   }

   logger.info('EXIT CONFLUENCE - NOT DONE WITH',hashId,'.  Remaining keys: ', remainingKeys(hash));
   return;
}

/**
 * Check to see if all hash entries have been received yet or not.  We will know when
 * none of them have the pending flag any more.
 *
 * @param hash
 *
 * @return true if we have received all inputs for the hash
 */
function haveAll(hash) {
    return ! _.reduce( _.pluck(hash, 'pending'), function( memo, val) { return memo || val });
}

function invalidKeyValue(value) { 
   return (_.isUndefined(value) || (_.isObject(value) && _.isEmpty(value)));
}

function remainingKeys(hash) {
    return _.mapObject(hash, function(val, key) { if (val.pending) return key; });
}
