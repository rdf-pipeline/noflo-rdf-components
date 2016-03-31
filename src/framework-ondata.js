/**
 * File: framework-ondata.js 
 */
var _ = require('underscore');
var util = require('util');

var createState = require('./create-state');
var createLm = require('./create-lm');
var vniManager = require('./vni-manager');

/** 
 * The standard RDF pipeline framework ondata method. This is called whenever  
 * there is new data on any port.  This method will update the input state,
 * and determine if the component updater should be executed now or not. 
 * If the updater should be executed, the fRunUpdater wrapper API will be
 * called to to handle that.  The updater output (or error) will be stored 
 * in output or error state, and those results will be sent on to any 
 * down stream components for their processing.
 * 
 * @this port context
 * @param payload data coming into the port
 * @param socketIndex socket index if the port is a multiple input (addressable) 
 */
module.exports = function( payload, socketIndex ) {

     var portName = this.name;

     var vnid = payload.vnid || '';
     var vni = this.nodeInstance.vni(vnid);

     var inputState = (_.isUndefined( payload.vnid )) ? createState( vnid, payload ) : payload;
     vni.inputStates( portName, socketIndex, inputState );

     if ( shouldRunUpdater( vni ) ) { 

         // Save vars we will need in the promise where the context is different
         var outputPorts = this.nodeInstance.outPorts;

         var lastErrorState = _.clone( vni.errorState() );  // Shallow clone 
         var lastOutputLm = vni.outputState().lm;

         if ( ! _.isFunction( this.nodeInstance.wrapper.fRunUpdater ) ) { 

             // Don't have a wrapper fRunUpdater 
             throw Error( 'No wrapper fRunUpdater function found!  Cannot run updater.' );

         } else { 
             // TODO: revisit this logic later, per rdf-pipeline/noflo-rdf-pipeline#35

             // save data used to see if we have a different state after running updater
 
             clearStateData( vni.errorState ); // clear last error state

             // Save wrapper to make it accessible from the Promise
             var wrapper = this.nodeInstance.wrapper;

             new Promise(function( resolve ) { 
                 // Execute fRunUpdater which will also execute the updater
                 resolve( wrapper.fRunUpdater( vni ) );

             }).then( function() { 
                 // fRunUpdater/Updater success path

                 // Returned OK, but updater could have set an error - check for that
                 // and update the LM if the state has changed
                 if ( stateChange( vni.errorState, lastErrorState, true ) ) {
                    setOutputErrorFlag( vni );   
                    lastOutputLm = undefined;  // got a new error so force sending output
                 }

                 handleOutput( outputPorts.output, lastOutputLm, vni.outputState() );
                 handleError( vni, outputPorts.error,  lastErrorState );

             }, function( rejected ) { 
                 // fRunUpdater/updater failed 
                 if ( isInitState( vni.errorState ) ) { 
                     // fRunUpdater/updater has not already set an error state - use the rejected info
                     changeStateData( vni.errorState, rejected );
                 }

                 setOutputErrorFlag( vni, true ); 

                 stateChange( vni.outputState, lastOutputLm, false );
                 stateChange( vni.errorState, lastErrorState, true );

                 handleOutput( outputPorts.output, lastOutputLm, vni.outputState() );
                 handleError( vni, outputPorts.error, lastErrorState );
                  

                 // If we haven't already processed the rejected error, do it now
                 if ( rejected !== vni.errorState().data ) { 
                     lastErrorState = _.clone( vni.errorState() );   
                     changeStateData( vni.errorState, rejected );
                     if ( stateChange( vni.errorState, lastErrorState, true ) ) { 
                         lastErrorState.lm = undefined; 
                     } 
                     handleError( vni, outputPorts.error, lastErrorState );
                 }

                 if ( rejected !== vni.errorState().data ) { 
                     lastErrorState = _.clone( vni.errorState() );   
                     changeStateData( vni.errorState, rejected );
                     handleError( vni, outputPorts.error, lastErrorState );
                 }

             }).catch( function( e ) { 
                 console.error( "framework-ondata unable to process fRunUpdater results!" );
                 var err = ( e.stack ) ? e.stack : e;
                 console.error( err );
             }); 
         } // have an fRunUpdater
     } // not ready for fRunUpdater yet
};

/*******************************************************************************/
/* Error & Output State handling                                               */
/*******************************************************************************/                 

/**
 * change state data to the specified newData value
 *
 * @param stateFacade a getter/setterfunction for the current state
 */ 
function changeStateData( stateFacade, newData ) { 
    var currentState = stateFacade();
    currentState.data = newData;
    currentState.lm = createLm();
    stateFacade( currentState );
}

/**
 * Clears the state data field by setting it to undefined.  
 *
 * @param stateFacade a getter/setterfunction for the current state
 */
function clearStateData( stateFacade ) { 
    var currentState = stateFacade();
    currentState.data = undefined;
    currentState.lm = undefined;
    currentState.error = undefined;
    stateFacade( currentState );
}

/**
 * Sends an error state on to any attached port on a down stream node if it's a new error.
 * If there is no attached port, logs the error so it can be analyzed.
 *
 * @param port the error port, which may or may not be attached to something down stream
 * @param lastErrorState last error state
 */
function handleError( vni, port, lastErrorState  ) { 

    if ( haveError( vni ) )  {

        var state = vni.errorState();

        // Is this the same error we saw last time we ran the updater?
        if ( (! _.isUndefined( state.data )) && (! _.isUndefined( lastErrorState.data )) && 
             state.data === lastErrorState.data ) { 
           state.lm = lastErrorState.lm;
           vni.errorState( state );
         } 

        if ( (! handleOutput( port, lastErrorState.lm, state )) && state.data )  { 
            // State was not sent on to an attached port, and we do have error data
            // so go ahead and log it for debugging/support use.
            if ( state.data.stack ) { 
                console.error( state.data.stack );
            } else { 
                console.error( state.data );
            }
        }
    }
}

/**
 * Returns true if the state is an initial vni state that has not got any
 * values in it yet.
 */
function isInitState( state ) { 
    return ( _.isUndefined( state.data ) && _.isUndefined( state.lm ) && _.isUndefined( state.error ) );
}

/**
 * Checks if state is new or not.  If it is new, it sends it down stream to any attached 
 * nodes; if there are no attached nodes, the state data will be logged.
 *
 * @param port an output port, which may or may not be attached to something down stream
 * @param lastLm last recorded state lm
 * @param state an error or output state to be sent down stream or logged
 *
 * @return true if the data was sent to an attached port on a down stream node;
 *         false if the data was not sent on
 */
function handleOutput( port, lastLm, state ) {

    // Do we have a new state or an error flag set? 
    if ( lastLm !== state.lm || state.error ) { 

        // Got any edges out of this port? 
        if (port.listAttached().length > 0) {
            port.send( state );
            port.disconnect();
            return true;
        }  
    } 

    return false;
}

/**
 * Set the output state error flag to true if there is a current error, false if not.
 * 
 * @param vni 
 * @param errorFlag (optional) if not undefined, the errorFlag value will be set
 */
function setOutputErrorFlag( vni, errorFlag ) {

    var outputState  = vni.outputState();
    if ( _.isUndefined( errorFlag ) ) { 
        outputState.error = ! _.isUndefined( vni.errorState().data );
    } else { 
        outputState.error = errorFlag;
    }

    vni.outputState( outputState );
}

/** 
 * Checks if the state was changed since the last state snapshot & if so, 
 * updates the LM to ensure the change propagates.
 *
 * @param stateFacade a getter/setterfunction for the current state
 * @param lastState a saved clone of the last state 
 * @param if true, the LM will be updated to ensure the change is propagated
 *
 * @return returns true if state was updated, false if not.
 */
function stateChange( stateFacade, lastState, updateLm ) { 

    var currentState = stateFacade();

    var lastData = ( _.isObject( lastState )  ) ? lastState.data : lastState;
    if ( currentState.data  !== lastData ) { 

        if ( updateLm ) { 
            currentState.lm = createLm();
            stateFacade( currentState );
        } 

        return true;
    }

    return false;
}

/*******************************************************************************/
/* Support for default shouldRunUpdater policy                                 */
/* Default policy checks to be sure there is data on all attached input ports. */
/*******************************************************************************/                 

/** 
 * Retrieve all attached input ports for the noflo component associated with this
 * node instance. 
 *
 * @param node instance context
 *
 * @return an array with the attached noflo port objects
 */
function attachedInputPorts( node ) { 

    return _.filter( node.inPorts, 
                     function( port) { return  port.listAttached().length > 0; });
}

/**
 * returns true if there is data on all attached input ports; false if not
 * 
 * @param vni 
 */
function haveAllInputs( vni ) {

    var attachedInPorts = attachedInputPorts( vni.nodeInstance );

    // If we have undefined data on any port, return false; if we 
    // have data on all ports, return true
    return ! _.some( attachedInPorts, function( port ) { 

        var states = vni.inputStates( port.name );
        return ((_.isUndefined( states ) ||
                ( _.isArray( states ) &&  _.some( states, _.isUndefined ))) ||
                haveInputErrors(states));
    });
}

/**
 * Returns true if currently have an error; false if not
 */
function haveError( vni ) { 
    var errorState = vni.errorState();
    return ! ( _.isUndefined( errorState.data ) &&  _.isUndefined( errorState.lm ) );  
}

/** 
 * Returns true if any of the input states have the error flag set to true; 
 * returns false if there are no states, or the input states are set to undefined or false.
 *
 * @param states a state object, array of states (if multi input), or undefined if there are no states
 */
function haveInputErrors( states ) {

    if ( _.isArray( states ) ) {
        return _.reduce( states, function( result, state ) {
            return result || state.error;
        }, false);
    } else if ( _.isObject( states ) ) {
        return ( states.error === true );
    }

    return false;
}

/** 
 * Check the input to see if we have all data attached to run the updater or not. 
 * This is simply a default updater policy - we may have other policies in the future.
 * 
 * @param node node instance of the RDF pipeline component
 * @param vni virtual node instance whose input states are to be checked.
 *
 * @return true if we have received data on all attached input port edges
 */
function shouldRunUpdater( vni ) { 
    // TODO: May add different policies in the future.  This is why we 
    // do NOT call the function below directly
    return haveAllInputs( vni );
}
