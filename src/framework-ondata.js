/**
 * File: framework-ondata.js 
 */
var _ = require('underscore');
var util = require('util');

var stateFactory = require('./create-state');
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

     // Update the input state
     var inputState = (payload.vnid) ? payload : stateFactory( vnid, payload );
     vni.inputStates( portName, socketIndex, inputState );

     // check if should run updater & run if necessary
     if ( shouldRunUpdater( vni ) ) { 
          
        // Save vars we will need in the promise where the context is different
        var outputPorts = this.nodeInstance.outPorts;

        if ( _.isUndefined( this.nodeInstance.wrapper.fRunUpdater ) || 
             ! _.isFunction( this.nodeInstance.wrapper.fRunUpdater ) ) { 

             // Don't have a wrapper fRunUpdater 
             throw Error( 'No wrapper fRunUpdater function found!  Cannot run updater.' );

        } else { 

            // save current error & output state LMs to compare after updater runs
            var lastOutputLm = vni.outputState().lm;
            var lastErrorLm = vni.errorState().lm;
            var wrapper = this.nodeInstance.wrapper;

            new Promise(function( resolve ) { 
                resolve( wrapper.fRunUpdater.call( vni ) );

            }).then( function() { 
                // If not new output or error state data, send it downstream or log it to the console
                handlePortOutput( outputPorts.output, lastOutputLm, vni.outputState() );
                handlePortOutput( outputPorts.error,  lastErrorLm, vni.errorState() );

            }, function( rejected ) { 
    
                // fRunUpdater failed - is this a new error? 
                var errorState = vni.errorState();

                if ( lastErrorLm !== errorState.lm  ) { 

                    // fRunUpdater or updater recorded a new lm (i.e., new error) - send it on
                    handlePortOutput( outputPorts.error, lastErrorLm, errorState );

                 } else if ( rejected !== errorState.data ) { 

                    // Same LM as before we called fRunUpdater, but new error data was detected
                    // TODO: vni.error.setPreviousLmsFromInputStates(vni);
                    vni.errorState( stateFactory( vnid, rejected ) );
                    handlePortOutput( outputPorts.error, lastErrorLm, vni.errorState() );
                 }
                 // NB: not currently forwarding errors if same LM and same data - should we be? 

            }).catch( function() { 
               console.error( "framework-ondata unable to process fRunUpdater results!" );
               reject();
            } ); 
            
        }
     } 
};

/** 
 * Retrieve all attached input ports for the noflo component associated with this
 * node instance. 
 *
 * @this node instance context
 *
 * @return an array with the attached noflo port objects
 */
function attachedInputPorts() { 

    return _.filter( this.inPorts, 
                     function( port) { return  port.listAttached().length > 0; });
}

/**
 * Checks if state is new or not.  If it is new, it sends it down stream to any attached 
 * nodes; if there are no attached nodes, the state data will be logged.
 *
 * @param port an output port, which may or may not be attached to something down stream
 * @param lastLm last recorded state lm
 * @param state an error or output state to be sent down stream or logged
 */
function handlePortOutput( port, lastLm, state ) {

    // Do we have a new state? 
    if ( lastLm !== state.lm ) { 

        // Got any edges out of this port? 
        if (port.listAttached().length) {
            port.send( state );
            port.disconnect();
        } else {
            console.error( state.data );
        }
    } 
}

/** 
 * Check the input to see if we have all data required to run the updater or not. 
 * This is simply a default updater policy - we may have other policies in the future.
 * 
 * @param node node instance of the RDF pipeline component
 * @param vni virtual node instance whose input states are to be checked.
 *
 * @return true if we have received data on all required input port edges
 */
function shouldRunUpdater( vni ) { 

    var attachedInPorts = attachedInputPorts.call( vni.node );

    if ( ! _.isEmpty( attachedInPorts ) ) { 

        // Check if we have input on all input ports and their edges
        for ( var i=0, max=attachedInPorts.length; i < max; i++ ) { 

            var port = attachedInPorts[i];
            var states = vni.inputStates( port.name );
            
            // figure out how many input states we have received
            var numberOfStates = 0;
            if ( _.isArray( states ) ) { 
               // filter out any undefined states and then count what we really have
               var flattenedStates = _.filter( states, 
                                               function(state) { return ! _.isUndefined(state); });
               numberOfStates = flattenedStates.length;
            } else if ( _.isObject( states ) ) {
                numberOfStates = 1;
            }

            if (( numberOfStates === 0 ) || ( port.listAttached().length != numberOfStates )) {
                return false;
            }
        }
    }
 
    return true;
}
