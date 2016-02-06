/**
 * InputStates.js
 * 
 *  Manages the RDF pipeline input states for a VNI
 */

var _ = require('underscore');

var requests = {
        GET_IIP_STATE: 1,
        SET_IIP_STATE: 2,
        GET_EDGE_STATE: 3,
        SET_EDGE_STATE: 4 
};

/**
 * Getter and Setter for an input state 
 *
 * If no new state is specified, this method will get the current input state  
 * If a new state is specified, it will be stored in the inputStates array.
 *
 * @param inportName name of the input port whose state is being recorded
 * @param sourceNodeName (optional) name of the node that sent the new state data
 * @param sourcePortName (optional) name of the the source node port that sent the state data.
 * @param newState a State object containing both a data payload and an lm.
 *
 * @this vni context.  This will contain the inputStates array.
 * @return getter path returns the current input port state state.
 *         setter path returns the current context 
 */ 
module.exports = function( inportName, sourceNodeName, sourcePortName, newState ) { 

    switch (arguments.length) { 

        // One argument - inportName only.  Used for a constant input source.
        case requests.GET_IIP_STATE: {
            if ( this.inputStates ) { 
                var inputState =  _.findWhere( this.inputStates,
                                               {inportName: inportName} );
                if ( inputState ) {
                    return inputState.state;
                }
            } 
            return;
        }

        // two arguments - inportName and newState.  Used for a constant input source.
        case requests.SET_IIP_STATE: {
            this.inputStates = this.inputStates || [];
            this.inputStates.push({ inportName: inportName,
                                    state: arguments[arguments.length-1] });
            return this;
        }

        // three arguments - inportName, sourceNodeName, and sourcePortName
        // Used for an input source that may be updated.
        case requests.GET_EDGE_STATE: {
            if ( this.inputStates ) { 
                var inputState =  _.findWhere( this.inputStates,
                                               { inportName: inportName,
                                                 sourceNodeName: sourceNodeName, 
                                                 sourcePortName: sourcePortName} );
                if ( inputState ) {
                    return inputState.state;
                }
            }
            return;
        }

        // four arguments - inportName, sourceNodeName, sourcePortName, and newState
        // Used for an input source that may be updated.
        case requests.SET_EDGE_STATE: {
            this.inputStates = this.inputStates || [];
            this.inputStates.push( { inportName: inportName, 
                                     sourceNodeName: sourceNodeName,
                                     sourcePortName: sourcePortName,
                                     state: newState } );
            return this;
        }

        default: {
            throw new Error("Invalid arguments specified for InputState");
        }
    }
}
