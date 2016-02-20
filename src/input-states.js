/**
 * input-states.js
 * 
 * Manages RDF pipeline input states for a VNI
 * TODO: Add optimization for input states as a sorted array
 */

var _ = require('underscore');

var InputType = {
    IIP: 1,
    PACKET: 2
};
var ALL_PORTINFO_KEYS = [ 'inportName', 'sourceNodeName', 'sourcePortName' ];

var inputStates = [];

/**
 * Get the index to the state in the input states array if it exists already
 * 
 * @param portInfo an object that describes the port(s) associated with the data
 *
 * @return an integer index into the inputStates array if a state is found or -1 if no state was found.
 */
function getStateIndex( portInfo ) { 

    var portSourceNodeName = portInfo.sourceNodeName || '';
    var portSourcePortName = portInfo.sourcePortName || '';

    return _.findIndex( inputStates, function(inputState) { 
        
        var stateSourceNodeName = inputState.sourceNodeName || '';
        var stateSourcePortName = inputState.sourcePortName || '';

        return ( portInfo.inportName === inputState.inportName &&
                 portSourceNodeName === stateSourceNodeName &&
                 portSourcePortName === stateSourcePortName );
    });
}


function insertAtIndex( portInfo ) { 

    var portSourceNodeName = portInfo.sourceNodeName || '';
    var portSourcePortName = portInfo.sourcePortName || '';

    for ( var i=0, max=inputStates.length; i < max; i++ ) { 
  
        var inputState = inputStates[i];
        var stateSourceNodeName = inputState.sourceNodeName || '';
        var stateSourcePortName = inputState.sourcePortName || '';

        if ( portInfo.inportName <= inputState.inportName &&
             portSourceNodeName <= stateSourceNodeName &&
             portSourcePortName <= stateSourcePortName ) {
             
             return i;
        }
    }

    // Never found a greater value so we'll insert onto the end of the inputStates array
    return inputStates.length;
}

function isIip( portInputType ) { 
    return portInputType === InputType.IIP;
}

function isPacket( portInputType ) { 
    return portInputType === InputType.PACKET;
}

/**
 * Validates we have good portInfo and determines whether portInfo is for an IIP input
 * or a packet input. 
 *
 * @param portInfo a port info object
 * 
 * @return the state type (InputType.IIP or InputType.Packet) depending on which kind of 
 *         portInfo was received.  
 * @throws an error if the portInfo is not valid.
 */
function verifyPortInfoType( portInfo ) { 

    if ( _.isEmpty( portInfo ) ) { 
        throw new Error("Invalid input state information - no input port name found!");
    }

    var keys = _.keys( portInfo );
    switch ( keys.length ) { 

        case 1: { 
            if (keys[0] === 'inportName' ) {
                return InputType.IIP;
            }
            throw new Error("Invalid input state IIP port information specified!");
        }

        case 3: { 
            // Make sure we really have the 3 portInfo keys we want, and not 3 other keys 
            var lookupKeys = _.pick( portInfo, ALL_PORTINFO_KEYS ); 
            if ( lookupKeys && _.keys( lookupKeys ).length === 3  ) {
               return InputType.PACKET;
            }
            throw new Error("Invalid input state packet port information specified!");
        }

        default: {
            throw new Error("Invalid input state port information found!");
        }
    }
}

module.exports = { 

    /** 
     * count the number of input states for the specified port.  This will count
     * any state associated with the portname - both IIP and packet input states.
     *
     * @param portName name of port 
     *
     * @return the number of input states associated with that port.
     */
    count: function( portName ) { 
        var states = _.where( inputStates, { inportName: portName } );
        return ( _.isEmpty( states ) ? 0 : states.length );
    },

    /**
     * Delete all input port states 
     */
    deleteAll: function() { 
        inputStates.splice( 0, inputStates.length );
    },

    /**
     * Delete the state associated with the specified port.
     *
     * @param portInfo the port information for the state to retrieve.  All portInfo objects must
     *                 have an inportName.  Optionally, if the state is from another component and
     *                 was therefore received in a packet, the portInfo may include: 
     *                 <ul> 
     *                    <li> sourceNodeName (optional) name of the node that sent the new state data </li>
     *                    <li> sourcePortName (optional) name of the the source node port that sent the state data.</li>
     *                 </ul>
     * @throws an error if the portInfo is not valid.
     */
    delete: function( portInfo ) { 

        verifyPortInfoType( portInfo );
        var index = getStateIndex( portInfo ); 

        if ( index !== -1 ) { 
            inputStates.splice(index, 1);
        }
 
        return this;
    },

    /** 
     * Get all input data for the specified port.  If there are multiple inputs on this port,
     * an array of the input data will be returned.
     *
     * @param portName name of port for which all state data should be retrieved
     *
     * @return all port data associated with the portName
     */
    getData: function( portName ) { 

        var states = _.pluck( _.where( inputStates, { inportName: portName } ), 'state' );

        if ( _.isEmpty( states ) ) { 
            return {};
        } 

        if ( states.length === 1 ) { 
            return states[0].data;
        }

        return _.pluck( states, 'data' ); 
    },

    /**
     * Finds and returns the input state associated with the port if it exists.
     *
     * @param portInfo the port information for the state to retrieve.  All portInfo objects must
     *                 have an inportName.  Optionally, if the state is from another component and
     *                 was therefore received in a packet, the portInfo may include: 
     *                 <ul> 
     *                    <li> sourceNodeName (optional) name of the node that sent the new state data </li>
     *                    <li> sourcePortName (optional) name of the the source node port that sent the state data.</li>
     *                 </ul>
     *
     * @return returns the current input port state state.
     * @throws an error if the portInfo is not valid.
     */ 
   get: function( portInfo ) { 

       verifyPortInfoType( portInfo );
       var index = getStateIndex( portInfo ); 

       if ( index !== -1 ) { 
           return inputStates[index].state;
       }

       return;
   },


   /**
    * Sets the input state for a port.  If the state already exists, it is simply updated.  If the 
    * state does not yet exist, it will be created.
    *
    * @param portInfo the port information for the state to retrieve.  All portInfo objects must
    *                 have an inportName.  Optionally, if the state is from another component and
    *                 was therefore received in a packet, the portInfo may include: 
    *                 <ul> 
    *                    <li> sourceNodeName (optional) name of the node that sent the new state data </li>
    *                    <li> sourcePortName (optional) name of the the source node port that sent the state data.</li>
    *                 </ul>
    * @param newState a state object 
    *
    * @return the current context 
    */ 
   set: function( portInfo, newState ) { 
  
       var portInputType = verifyPortInfoType( portInfo );
       var index = getStateIndex( portInfo ); 

       if ( index === -1 ) { 
           // no state exists - create a new one
           if ( isIip( portInputType ) ) { 
               inputStates.splice( insertAtIndex( portInfo ), 0, 
                                   { inportName: portInfo.inportName,
                                     state: newState });

           } else if ( isPacket( portInputType ) ) {
               inputStates.splice( insertAtIndex( portInfo ), 0, 
                                   { inportName: portInfo.inportName, 
                                     sourceNodeName: portInfo.sourceNodeName,
                                     sourcePortName: portInfo.sourcePortName,
                                     state: newState } );
           } else {
               throw new Error('Unknown input port type');
           }

       } else { 
          // state exists so just update the state data
          inputStates[index].state = newState;
       }

       // console.log('set exiting with inputStates: ',inputStates);
       return this;
   }

};
