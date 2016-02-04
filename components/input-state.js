// input-state.js

var _ = require('underscore');

var Lm = require('./Lm');

var inputStates = {}; 

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
     * Get/set the current state for the specified input port from the originating port
     */
    inputState: function( inputPortName, originatingNodeName, originatingPortName, newState ) {

        if ( inputPortName && originatingNodeName ) {

            originatingPortName = 
                (_.isUndefined( originatingPortName) || _.isEmpty( originatingPortName )) ? IIP_PORT : originatingPortName;

            if ( _.isUndefined( inputStates[inputPortName] ) ) { 
                inputStates[inputPortName] = {};
            }
            if ( _.isUndefined( inputStates[inputPortName][originatingNodeName] ) ) {
                inputStates[inputPortName][originatingNodeName] = {};
            }
            if ( ! _.isUndefined( newState ) ) { 
                inputStates[inputPortName][originatingNodeName][originatingPortName] = newState;
            } 

            return inputStates[inputPortName][originatingNodeName][originatingPortName];  

        } else { 
            return;
        }
    }
 
};
