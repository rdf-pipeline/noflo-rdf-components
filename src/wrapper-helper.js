// wrapper-helper.js

/**
 * This file contacts the helper functions that may be used by any pipeline component
 */

var _ = require('underscore');

var createLm = require('../src/create-lm');

module.exports = {
    executeUpdater: executeUpdater,
    getUpdaterParameters: getUpdaterParameters,
    groupLm: groupLm,
    handleUpdaterException: handleUpdaterException,
    updateOutputState: updateOutputState
};

function getUpdaterParameters(vni, updaterFormals) { 

    var updaterActuals = [];
    if (_.isEmpty(updaterFormals)) {

        // No updater arguments specified
        // TODO: handle multiple ports even though no input args
        var states = vni.inputStates();
        if (states && states.input && states.input.data) {
            updaterActuals[0] = states.input.data;
        }

    } else {
        // Have one or more updater parameters - get them in the right order and pass them
        updaterActuals = _.map(updaterFormals, function(arg) {
           var state = vni.inputStates(arg);
           if (_.isUndefined(state)) {
               return undefined;
           } else if (_.isArray(state)) {
               // Have a parameter associated with a port with multiple inputs ->
               //  get an array of the data elements
               return _.pluck(state, 'data');
           } else if (_.isObject(state)) {
               // Just one input on this port parameter - get it
               return state.data;
           } else {
               throw Error("FRunupdater found an unexpected state: ", state);
           }
        });
    }

    return updaterActuals;
}

function executeUpdater(updater, updaterFormals, vni, updateOutputState) {
    var updaterActuals = getUpdaterParameters(vni, updaterFormals);

    var oldOutputStateLm = vni.outputState().lm;
    vni.outputState({error: undefined});

    // Execute the updater on the VNI context, passing the updater Parameters as the API arguments
    return new Promise(function(resolve) {

         var results = updater.apply(vni, updaterActuals);
         resolve(results);

     }).then(function(results) {
         // console.log('updater returned results: ',results);
         updateOutputState(results);
         return results;

    }).catch(function(e) {
        handleUpdaterException(vni, e);
    });
};



function groupLm(inputStates) { 
    if (!_.isEmpty(inputStates)) {
         return _.reduce( _.pluck(inputStates, 'groupLm'), 
                         function(memo, state) { return memo || state});
    }
}

function handleUpdaterException(vni, e) {
    // console.log('wrapper error: ',e);
    vni.outputState({error: true});
    vni.errorState({data: e, lm: createLm()});
}

function updateOutputState(vni, results) {
    if (! _.isUndefined(results)) {
        vni.outputState({data: results});
    }
}
