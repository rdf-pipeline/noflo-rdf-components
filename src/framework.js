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
                { rpf: {      // extend default noflo component node instance with framework rpf object 
                     vnis: vnis,
                     wrapper: wrapper
                  }
                } 
        );
    }

}; // module.exports


var ondata = function( payload, portName, socketIndex, port ) {

     // socketIndex is only defined for addressable/multi ports so set default of 0 if not defined.  
     // If there is only one input, we can just default to socket index 0, so if not defined, 
     // do this for now.   We need to discuss whether addressable should just be required on our 
     // pipeline ports.  IMHO, I think it probably should be to minimize potential user-error in this area
     // and simplify the interface our users work with.
     socketIndex = socketIndex || 0;

     var vnid = payload.vnid || '';
     var vni = vnis.get.call( this.nodeInstance, vnid );
     vni.inputStates.set.call( vni.node, 
                               portInfo.call( vni.node, portName, socketIndex ),
                               stateFactory( vnid, payload ) );

     // check if should run updater & run if necessary
     if ( shouldRunUpdater( vni ) ) { 
        var data = this.nodeInstance.rpf.wrapper.fRunUpdater( vni.inputStates );
        if ( data ) {
            var outputState = stateFactory( vnid, data );
            vni.outputState = outputState;

            // TODO: Discuss whether this should be in the access layer instead of here
            this.nodeInstance.outPorts.output.send( outputState )
            this.nodeInstance.outPorts.output.disconnect();

            // Clean up input states
            vni.inputStates.deleteAll();
        }
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
function shouldRunUpdater( vni ) { 

    var requiredInPorts = requiredInputPorts.call( vni.node );

    if ( ! _.isEmpty( requiredInPorts ) ) { 

        // Check if we have input on all the required input ports and their edges
        for ( var i=0, max=requiredInPorts.length; i < max; i++ ) { 
            var port = requiredInPorts[i];
            if ( ! hasAllInputs( port, vni.inputStates.count( port.name ))) {
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
 * Check to see if we have received input on all of a port's edges or not.
 * TODO: Move this to the noflo access layer
 * 
 * @param port a noflo port object
 * @param inputCount the number of inputs received for this port so far.
 *
 * @return true if the inputCount matches the number of sockets for the port.
 *         There will be one socket for each connected input edge.  
 */
function hasAllInputs( port, inputCount ) {
    return (port.sockets.length === inputCount); 
}

/** 
 * Examines the port socket to determine if the current data input is for an IIP input.
 *
 * TODO: Move this to the noflo access layer
 * TODO: Discuss how to handle this if we do not have an addressable port - I don't think it's possible 
 *       to tell if it's an IIP input if there are multiple inputs and the port is not addressable 
 *       since we don't know which socket fired.  Should we make all of our ports addressable?  This also 
 *       lets us eliminate the need for a multi facade and simply hides this from the user.  
 * 
 * @this node instance context
 * @param portName name of the port being examined
 * @param socketIndex socket index into the port 
 *
 * @return true if this input is for an IIP data payload
 */
function isIIP( portName, socketIndex ) {
    var port = this.inPorts.ports[portName];
    var socket = port.sockets[socketIndex];

    // An IIP port will have a socket.to attribute, but will not have any socket.from
    // A packet port will have both a socket.to and a socket.from attribute.
    return  _.isUndefined( socket.from ) && ! _.isUndefined( socket.to );
} 

/** 
 * Get the portInfo for a packet port. 
 * TODO: Move this to the noflo access layer
 * 
 * @this node instance context
 * @param portName name of the port being examined
 * @param socketIndex socket index into the port 
 * 
 * @return a portInfo object with the following structure: 
 *        { inportName: portName,
 *          sourceNodeName: sourceNodeName, (for packet input only)
 *          sourcePortName: sourceNodePort } (for packet input only)
 */
function portInfo( portName, socketIndex ) { 

    if (isIIP.call( this, portName, socketIndex )) { 

        // If the incoming socket data is from an IIP, there is no source 
        // node - IIPs are simply constant input, so just return the port name.
        return {inportName: portName};

    } else {

        // Got a packet from some other noflo component - record both this 
        // port name, plus the originating (source) node name and port so we
        // have an audit trail
        var socket = this.inPorts.ports[portName].sockets[socketIndex]; 
        return {inportName: portName,
                sourceNodeName: socket.from.process.id, 
                sourcePortName: socket.from.port };
    }
}

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

    return _.map( this.inPorts.ports, 
                  function( port) { 
                      if ( port.options.required ) {
                          return port; 
                      }
                  }
           );
}
