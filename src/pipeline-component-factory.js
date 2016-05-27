/**
 * File: pipeline-component-factory.js 
 *
 * Creates an RDF pipeline component factory. RDF pipeline components should instantiate with
 * the following extensions beyond the standard noflo component:
 *    - It must have an output and an error port.  Any other output ports are optional
 *   - A vni facade as part of the node instance
 *   - A wrapper object in the node instance that is to be used to hold a reference to the 
 *     standard RDF framework wrapper functions: fRunUpdater, fExists, and fDestroyState. More 
 *     details on wrappers can be found here: 
 *        https://github.com/rdf-pipeline/noflo-rdf-pipeline/wiki/Wrapper-API
 * In addition, rdf pipeline nodes should register an ondata callback function on each input port
 * to be called whenever new data is received.
 */

var _ = require('underscore');
var util = require('util');

var nofloCompFactory = require('./noflo-component-factory');
var promiseOutput = require('../src/promise-output');
var vniManager = require('./vni-manager');
var framework_ondata = require('./framework-ondata');
var profiler = require('./profiler');

/**
 * Creates a noflo-component factory, as described by the nodeDef parameter, 
 * customizing the factory with RDF pipeline specific data and funtionality. 
 * 
 * @param nodeDef a node definition describing the noflo component to be created
 * @param wrapper an object representing the updater wrapper interface.  It will usually 
 *        contain the 3 required updater wrapper functions: fRunUpdater, fExists, and 
 *        fDestroyState.
 * @param ondata (optional) event handler. If not provided, the framework-ondata will be
 *        used.  Testing is a primary use case for this parameter.
 * 
 * @return a pipeline customized noflo component factory
 */

module.exports = function(nodeDef, wrapper, ondata) { 

    ondata = ondata || framework_ondata;

    // Create the component factory and return it
    return nofloCompFactory(
        _.defaults(
            { 
              inPorts: 
                   // Add the framework ondata function to each input port so we get called
                   // when new data arrives 
                   _.mapObject(nodeDef.inPorts, function(port, portName) {  
                       return _.extend({ ondata: ondata }, 
                                        port);
                   }),

              outPorts:  
                   // ensure we have the standard output & error ports and add in any custom ports
                   _.extend({},
                             promiseOutput.outPorts,
                             nodeDef.outPorts)
            },
            nodeDef 
       ), 
        // specify a callback to initialize node facade with pipeline specific settings
        // after the noflo-component-factory initializes the node instance
        _.partial(pipelineNodeInit, wrapper) 
   );

} // module.exports

/**
 * callback function invoked by the noflo component factory to allow us to initialize the
 * pipeline node instance with RDF pipeline specific data e.g., vni facade & wrapper.
 * 
 * @param node facade to be initialized
 */
var pipelineNodeInit = function(wrapper, facade) { 
    vniManager(facade);
    facade.wrapper = wrapper || {};
    profiler(facade);
}
