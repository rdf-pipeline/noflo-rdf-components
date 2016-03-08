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

     // Set the input states
     vni.inputStates( portName, socketIndex, stateFactory( vnid, payload ) );

     // check if should run updater & run if necessary
     if ( shouldRunUpdater( this.nodeInstance, vni ) ) { 
          
        // Save vars we will need in the promise where the context is different
        var outputPorts = this.nodeInstance.outPorts;

        if ( _.isUndefined( this.nodeInstance.wrapper.fRunUpdater ) || 
             ! _.isFunction( this.nodeInstance.wrapper.fRunUpdater ) ) { 

             // Don't have a wrapper fRunUpdater 
             throw Error( 'No wrapper fRunUpdater function found!  Cannot run updater.' );

        } else { 
            var promise = this.nodeInstance.wrapper.fRunUpdater.call( vni );
            Promise.resolve( promise ).then( function( data ) { 

                // Set output state and send it on over the output port
                if (data) {
                    var outputState = stateFactory( vnid, data );
                    vni.outputState( outputState );
    
                    // Should this be in access or output layer? 
                    outputPorts.output.send( outputState );
                    outputPorts.output.disconnect();
                }
            }, function( error ) { 
    
                // Set error state and send it on over the error port
                var errorState = stateFactory( vnid, error );
                vni.errorState( errorState );

                outputPorts.error.output.send( errorState );
                outputPorts.error.disconnect();
            }); 
        }
     } 

     return;
};

/** 
 * Check the input to see if we have all data required to run the updater or not. 
 * This is simply a default updater policy - we may have other policies in the future.
 * 
 * @param node node instance of the RDF pipeline component
 * @param vni virtual node instance whose input states are to be checked.
 *
 * @return true if we have received data on all required input port edges
 */
function shouldRunUpdater( node, vni ) { 

    var requiredInPorts = requiredInputPorts.call( node );

    if ( ! _.isEmpty( requiredInPorts ) ) { 

        // Check if we have input on all the required input ports and their edges
        for ( var i=0, max=requiredInPorts.length; i < max; i++ ) { 

            var port = requiredInPorts[i];
            var states = vni.inputStates( port.name );
            
            // figure out how many input states we have received
            var numberOfStates = 0;
            if ( _.isArray( states ) ) { 
               // filter out any undefined states and then count what we really have
               var flattenedStates = _.filter( states, function(state) { 
                   return ! _.isUndefined(state);
               });
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

/** 
 * Retrieve the required input ports for the noflo component associated with this
 * node instance. 
 *
 * @this node instance context
 *
 * @return an array with the noflo port details for required input ports.
 */
function requiredInputPorts() { 

    return _.filter( this.inPorts, 
                     function( port) { 
                         return ( port.isRequired() || port.listAttached().length > 0  );
                     })
}
