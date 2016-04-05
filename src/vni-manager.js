/**
 * File: vni-manager.js
 */
var _ = require('underscore');

var inputStates = require('./input-states');
var stateFactory = require('./create-state');

var DEFAULT_VNID = '';

/**
 * Manage the node's vni's by vnid.  If no vnid is provided the IIP VNID will be used.
 * If the vni for the specified vnid does not exist, a new one will be created.
 *
 * @this node unless otherwise specified on an API
 * @param node a component node instance (facade)
 *
 * @return the component facade, extended to include the vni interface
 * 
 * Usage examples: 
 *     var vni = node.vni(); // retrieve the default VNI 
 *     var vni = node.vni(vnid); // retrieve the vni associated with the vnid
 *
 *     node.deleteAllVnis();
 *     node.deleteVni( vnid );
 *     node.vni(vnid).delete();
 *
 *     node.vni().errorState( state );
 *     var state = node.vni().errorState();
 *
 *     node.vni().inputStates( {input: state} );
 *     var inputStates = node.vni().inputStates();
 *
 *     node.vni().outputState( state );
 *     var state = node.vni().outputState();
 */
module.exports = function( node ) { 

    _.extend( node, 
        {

          /**
           * Delete all vnis assiciated with the node instance.
           *
           * @this node instance
           * @return node instance node for easy chaining
           */ 
          deleteAllVnis: function() { 
              // reassign vnis array to an empty array and let garbage collection clean up
              this.vnis = {};
              return this;
          },

          /**
           * Delete the vni associated with the specified VNID
           * 
           * @param vnid vnid identifying which vni to delete
           *
           * @this node instance
           * @return node instance node for easy chaining
           */ 
          deleteVni: function( vnid ) {

              if ( vnid in this.vnis ) {
                  delete this.vnis[vnid];
              } 

              return this;
          },

          /**
           * Getter for a vni facade specified by the vnid parameter.  If no VNID is specified,
           * the IIP VNID will be used.  If the VNI does not yet exist, a new VNI will be
           * created.
           * 
           * @this node 
           * @param vnid vnid identifying which vni to delete
           *
           * @return node for easy chaining
           */ 
          vni: function( vnid ) { 

              vnid = vnid || DEFAULT_VNID;

              if ( _.isUndefined( this.vnis[vnid] )  ) {

                  // have no vni so create one with empty error & output state
                  this.vnis[vnid] = { 
                      errorState: stateFactory( vnid ), 
                      outputState: stateFactory( vnid ),
                  }; 

                  // TODO: Add parentVni setting here
              }

              var that = this; // save current node context to reference in facade
              return {
                  vnid: vnid,
                  delete: _.bind( this.deleteVni, this, vnid ),
                  inputStates: _.partial( inputStates, this, vnid ), 
                  errorState: _.partial( errorState, this.vnis[vnid] ), 
                  outputState: _.partial( outputState, this.vnis[vnid] ),
                  nodeInstance: that
              };
          },

          vnis: {}

    }); // extend
} // module export

/**
 * Get/Merge error state on the vni
 * 
 * @this vni context 
 *
 * @param vni vni whose state should be set or retrieved
 * @param state error state to be set
 *
 * @return the requested state or the current VNI context
 */
function errorState( vni, state ) {

    // Do we have a state to be set ?
    if ( arguments.length > 1 ) {

        if ( _.isUndefined(state) ) { 
            // Clear state
            delete vni.errorState;
        } else { 
            // Overwrite existing state object
            vni.errorState = _.extend(vni.errorState || {}, state);
        }

        return this;
    }

    // Get the state 
    return vni.errorState;
}

/**
 * Get/Merge output state on the vni
 * 
 * @this vni context 
 * 
 * @param vni vni whose state should be set or retrieved
 * @param state output state to be set
 *
 * @return the requested state or the current VNI context
 */
function outputState( vni, state ) {

    // Do we have a state to be set ?
    if ( arguments.length > 1 ) {
        if ( _.isUndefined(state) ) { 
            // Clear state
            delete vni.outputState;
        } else { 
            // Overwrite existing state
            vni.outputState = _.extend(vni.outputState || {}, state);
        }

        return this;
    }

    // Get the state
    return vni.outputState;
}
