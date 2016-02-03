// state.js

var _ = require('underscore');

var Lm = require('./Lm');

var inputStates = {}; 
var outputStates = {}; 

// Define Vni class and its subclasses - InterNodeVni & IipVni
function State() {
  this.lm = Lm();
}

function NodePortVni( vnid ) {
  State.call(this);
}

function IipState() {
  State.call(this);
}

var IIP_PORT =  '*';
 
module.exports = {

    /**
     * return a hash of all input states for every port and its sources 
     */
    allInputStates: function() { 
        return inputStates;
    },

    /**
     * return a hash of all input states for every port and its sources 
     */
    allOutputStates: function() { 
        return outputStates;
    },

    /**
     * Get/set the current state for the specified input port from the originating port
     */
    inputState: function( inputPortName, originatingNodeId, originatingPortName, payload ) {

        if ( inputPortName && originatingNodeId ) {

            originatingPortName = 
                (_.isUndefined( originatingPortName) || _.isEmpty( originatingPortName )) ? IIP_PORT : originatingPortName;

            if ( _.isUndefined( inputStates[inputPortName] ) ) { 
                inputStates[inputPortName] = {};
            }
            if ( _.isUndefined( inputStates[inputPortName][originatingNodeId] ) ) {
                inputStates[inputPortName][originatingNodeId] = {};
            }
            if ( ! _.isUndefined( payload ) ) { 
                inputStates[inputPortName][originatingNodeId][originatingPortName] = payload;
            } 

            return inputStates[inputPortName][originatingNodeId][originatingPortName];  

        } else { 
            return;
        }
    },
 
    /**
     * Get/set the current state for the specified output port
     */
    outputState: function( outPortName, state ) { 

       if ( outPortName ) { 

           if ( ! _.isUndefined( state ) ) { 
               outputStates[outPortName] = state;
           }

           return outputStates[outPortName];

        } else {
           return;
        }
    }

};
