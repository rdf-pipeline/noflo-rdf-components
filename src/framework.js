/**
 * File: framework.js 
 */
var _ = require('underscore');
var util = require('util');

var stateFactory = require('./create-state');
var vnis = require('./vnis');

/**
 * This module implements the core of the RDF Pipeline Framework.  
 */
module.exports = {

    componentFactory: function( nodeDef, wrapper ) { 
        
        var compFactory = require('./noflo-component-factory');
        return compFactory(
                _.defaults( {
                     // Add an ondata function to be invoked every time we receive new data
                     inPorts: _.mapObject(nodeDef.inPorts, function( port, portName ) {  
                         return _.extend({
                             ondata: function(payload, socketIndex) {
                                   var that = this; 
                                   return ondata.call( that, payload, portName, socketIndex, port );
                             }
                         }, port);
                     })
                 }, nodeDef ),
                {  // extend default noflo component node instance with RDF Pipeline extensions
                   // vnis: [],
		   wrapper: wrapper
                } 
        );
    }

}; // module.exports


var ondata = function( payload, portName, socketIndex, port ) {

console.log('\nenter '+this.nodeInstance.name+' ondata with port: ',portName);

     // socketIndex is only defined for addressable/multi ports so set default of 0 if not defined.  
     // If there is only one input, we can just default to socket index 0, so if not defined, 
     // do this for now. 
     socketIndex = socketIndex || 0;

     var vnid = payload.vnid || '';
     var vni = vnis.get.call( this.nodeInstance, vnid );

     vni.inputStates( this.nodeInstance, 
                      vnid, 
                      portName, 
                      stateFactory( vnid, payload ));

     // check if should run updater & run if necessary
     if ( shouldRunUpdater( this.nodeInstance, vni ) ) { 
          
        // console.log('shouldRunUpdater for '+this.nodeInstance.name+' on '+portName);
        var data = this.nodeInstance.wrapper.fRunUpdater( this.nodeInstance, vni );
        if ( data ) {
            var outputState = stateFactory( vnid, data );
            vni.outputState = outputState;

            // Should this be in access or output layer? 
            this.nodeInstance.outPorts.output.send( data );
            this.nodeInstance.outPorts.output.disconnect();
        }
     } else {
        // console.log('not ready to run updater on '+ this.nodeInstance.name + ' yet');
     }

     return;
};

/** 
 * Check the input to see if we have all data required to run the updater or not. 
 * This is simply a default updater policy - we may have other policies in the future.
 * 
 * @param vni virtual node instance whose input states are to be checked.
 *
 * @return true if we have received data on all required input port edges
 */
function shouldRunUpdater( component, vni ) { 

    var requiredInPorts = requiredInputPorts.call( component );

    if ( ! _.isEmpty( requiredInPorts ) ) { 

        // Check if we have input on all the required input ports and their edges
        for ( var i=0, max=requiredInPorts.length; i < max; i++ ) { 
            var port = requiredInPorts[i];
            var states = vni.inputStates( component,
                                          vni.vnid, port.name);
            var numberOfStates = 0;
            if ( _.isArray( states ) ) { 
               numberOfStates = states.length;
            } else if ( _.isObject( states ) ) {
                numberOfStates = 1;
            }
            // console.log('port '+port.name+' has numberOfStates: '+numberOfStates+" attached: "+port.listAttached().length);
            if ( port.listAttached().length != numberOfStates ) {
                return false;
            }
        }
    }
 
    return true;
}

/**********************************************************************************/
/* Move the following functions to the noflo access layer as soon as we have one! */
/**********************************************************************************/

/** 
 * Retrieve the required input ports for the noflo component associated with this
 * node instance. 
 * TODO: Move this to the noflo access layer
 *
 * @this node instance context
 *
 * @return an array with the noflo port details for required input ports.
 */
function requiredInputPorts() { 

    return _.map( this.inPorts, 
                  function( port) { 
                      if ( port.isRequired ) {
                          return port; 
                      }
                  }
           );
}
