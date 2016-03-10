/**
 * File: framework.js 
 */
var _ = require('underscore');
var util = require('util');

var componentFactory = require('./noflo-component-factory');
var stateFactory = require('./create-state');
var promiseOutput = require('../src/promise-output');
var vniManager = require('./vni-manager');

/**
 * This module implements the core of the RDF Pipeline Framework.  
 */
module.exports = {

    componentFactory: function( nodeDef, fRunUpdater ) { 
        
      return componentFactory(
          _.defaults( { // Add an ondata function to be invoked every time we receive new data
                        inPorts: _.mapObject(nodeDef.inPorts, function( port, portName ) {  
                            return _.extend({
                                ondata: _.partial( ondata, fRunUpdater ) 
                            }, port);
                        }),
                        outPorts: _.extend( {},
                                            promiseOutput.outPorts,
                                            nodeDef.outPorts )
                      },
                      nodeDef
          ), 
          vniManager 
      );
    }

}; // module.exports


// @this port context
var ondata = function( fRunUpdater, payload, socketIndex ) {

     var portName = this.name;

     var vnid = payload.vnid || '';
     var vni = this.nodeInstance.vni(vnid);

     // Check if we have a multi/addressable port and call the correct input-state API
     if ( _.isUndefined( socketIndex ) ) { 
         vni.inputStates( { [portName] : stateFactory( vnid, payload ) });
     } else {
         vni.inputStates( portName, socketIndex, stateFactory( vnid, payload ) );
     }

     // check if should run updater & run if necessary
     if ( shouldRunUpdater( this.nodeInstance, vni ) ) { 
          
        // Save vars we will need in the promise where the context is different
        var outputPorts = this.nodeInstance.outPorts;
        var errorPorts = this.nodeInstance.errorPorts;

        var promise = fRunUpdater.call( this.nodeInstance, vni.inputStates() );
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

            errorPorts.output.send( errorState );
            errorPorts.output.disconnect();
        }); 
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
