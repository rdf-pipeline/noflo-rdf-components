/**
 * File: vni-manager.js
 */
var _ = require('underscore');

var inputStates = require('./input-states');
var profiler = require('./profiler');
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
           * Calls fn for each known vni in the system
           *
           * @this node instance
           * @return node instance node for easy chaining
           */
          forEachVni: function(fn, thisArg) {
              var vnids = _.keys(this.vnis);
              for (var i=0,n=vnids.length; i<n; i++) {
                  fn.call(thisArg, this.vni(vnids[i]), vnids[i], this);
              }
              return this;
          },

          /**
           * Delete all vnis assiciated with the node instance.
           *
           * @this node instance
           * @return node instance node for easy chaining
           */ 
          deleteAllVnis: function() { 
              // decrement the vni counts
              profiler.pipelineMetrics.totalVnis -= _.keys(this.vnis).length;
              if (!_.isUndefined(this.vnis[''])) profiler.pipelineMetrics.totalDefaultVnis--;

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
                  profiler.pipelineMetrics.totalVnis--;
                  if (vnid === '') profiler.pipelineMetrics.totalDefaultVnis--;
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
                  var componentName = _.isUndefined(this.componentName) ? '' : this.componentName;
                  this.vnis[vnid] = { 
                      errorState: stateFactory( vnid, 
                                                undefined,  // no data yet
                                                undefined,  // no lm yet
                                                undefined,  // not an error
                                                undefined,  // not stale
                                                undefined,  // no groupLm 
                                                componentName ),
                      outputState: stateFactory( vnid, 
                                                 undefined,  // no data yet
                                                 undefined,  // no lm yet
                                                 undefined,  // not an error
                                                 undefined,  // not stale
                                                 undefined,  // no groupLm 
                                                 componentName )

                  }; 


                  // TODO: Add parentVni setting here

                  // Update VNI metrics
                  profiler.pipelineMetrics.totalVnis++;
                  if (vnid === '') profiler.pipelineMetrics.totalDefaultVnis++;
              }

              var that = this; // save current node context to reference in facade
              return {
                  vnid: vnid,
                  clearTransientInputs: _.bind(clearTransientInputs, this, this.vnis[vnid]),
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
 * Clear input states that are NOT a single IIP state
 * 
 * NOTE: USE WITH CARE.  THIS API WILL NOT WORK CORRECTLY IF USED
 *          - IN A PIPELINE WITH MULTIPLE PATIENTS PROCESSED IN PARALLEL
 *          - IN A SUBGRAPH
 *       IT NEEDS REVISITING TO SUPPORT MIXED IIP AND PACKET INPUTS
 * REVISIT WHEN WE DO A PROPER SPLIT/JOIN IMPLEMENTATION!!!
 *
 * @this node instance
 *
 * @return this node instance for easy chaining
 */
function clearTransientInputs(vni) {

    var states = vni.inputStates;

    var self=this;
    _.forEach(self.inPorts, function(port) {

        if (!_.isUndefined(states[port.name]) && !port.isSingleIIP()) {
            var numPortStates = _.isArray(states[port.name]) ? states[port.name].length : 1;
            if (numPortStates == 1) {
                delete states[port.name];
            } else if (numPortStates > 1) {
                 for (var i=0; i < numPortStates; i++) {
                     states[port.name][i] = undefined;
                 }
            }
        }
    });

    return this;
}

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
            var componentName = _.isUndefined(vni.nodeInstance) ? '' : vni.nodeInstance.componentName;
            vni.errorState = _.extend(vni.errorState || {componentName: componentName}, 
                                      state);
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
            var componentName = _.isUndefined(vni.nodeInstance) ? '' : vni.nodeInstance.componentName;
            vni.outputState = _.extend(vni.outputState || {componentName: componentName}, 
                                       state);
        }

        return this;
    }

    // Get the state
    return vni.outputState;
}
