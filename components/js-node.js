// js-node.js

/**
 * This component takes one or more JavaScript objects and executes the specified 
 * updater against them to create some kind of merged JavaScript object which may 
 * then be passed on to the next component.
 *
 * Configuration is specified using with an options json object, passed as
 * input on the "Options" port.  The expected format of that object is:
 *    { "name": <name of this node instance; this is a required setting>,
 *      "stateFile": <cannonical path for state file of this node (optional)>,
 *      "updater": <path to the javascript updater used to modify data; this is 
 *                  a required setting> }
 *
 * This component will send the following object on its output port upon completion:
 *     { "name": <name of this file-node instance>,
 *       "jsObject": <path for the state file to be used as backing store for this node>,
 *       "updaterArgs": <the arguments specified in the input options when updating this file-node, if there are any.> }
 *
 * See noflo-rdf-pipeline test 0060_Noflo_javascript_updater for an example.
 */

var _ = require('underscore');
var fs = require('fs');
var noflo = require('noflo');

var basenode = require('./base-node');
var basefnode = require('./base-file-node');

exports.getComponent = function() {
  return _.extend(
    new noflo.Component(
               _.extend( {},
                         basenode.defaultPorts,
                         { inPorts: {
                             options: {
                                 description: "Node configuration settings",
                                 datatype: 'object',
                                 required: false,
                                 addressable: false,
                                 buffered: false,
                                 process: basenode.on({data: basenode.assign('options')})
                             },
                             in: {
                                 description: "Source name and Javascript object input",
                                 datatype: 'object',
                                 required: true,
                                 addressable: false,
                                 buffered: false,
                                 process: basenode.on({data: handle})
                               }
                             }
                         }
               )
         ),
      {
        description: "Component for a RDF Pipeline js-file-node",
        icon: 'external-link',

        // The expected input/output port attribute names
        inOutAttrs: {
            sourceName: "name",
            sourceJsObject: "jsObject",
            updaterArgs: "updaterArgs"
        }
     });
}

// Once all data has been received, this function handles the RDF file-node update work
// and passes on the results to the next component(s).
function handle(data) {

    if ( ! this.options ) {
        return _.defer(handle.bind(this, data));
    }

    if (this.options.debug) {
        console.log("Executing js-node "+ this.options.name);
    }

    if ( ! this.dataArray ) {
        this.dataArray = new Array( data );
    } else {
        // Add this data input to our array of inputs
        var foundIt = ( this.dataArray.filter(function (el) {
            return (el === data);
        }).length > 0 );
        if (! foundIt) {
             this.dataArray.push( data );
        }
    }

    // There is one socket for each input edge - how many input edges
    // do we have?  If more than one, don't proceed til we have data from all
    var inputEdgeCount = this.inPorts.in.sockets.length;
    if ( this.dataArray.length < inputEdgeCount ) {
        return;
    }

    if (!this.options.name || !this.options.updater )  {
        throw new Error("Execute options are missing required settings.");
    }

    var stateFile = (this.options.stateFile) ? this.options.stateFile :
                        basefnode.defaultStateFile( this.options.name, process );

    var jsScriptPath = process.cwd()+"/"+this.options.updater;

    // Get a unique array of all values of updaterArgs from input
    var unique_updaterArgs = basefnode.uniqElemsWithAttr( this.dataArray, 
                                                          this.inOutAttrs.updaterArgs );

    try { 

        // Execute the javascript updater
        var myScript = require( jsScriptPath );
        var result = myScript.execute( this.dataArray.concat( unique_updaterArgs ));
        if ( this.options.debug ) { 
            console.log("result: ", JSON.stringify(result));
        }

        // write the resulting object to the state file and send it to the next component
        if ( result ) { 
            var sendPayload = { [this.inOutAttrs.sourceName]: this.options.name,
                                [this.inOutAttrs.sourceJsObject]: result };
            basefnode.writeStateFile( stateFile, 
                                      JSON.stringify(result),
                                      this.outPorts,
                                      sendPayload );
            if ( this.dataArray ) {
                this.dataArray.length = 0;
            }
        }

    } catch(e) { 
        console.log("Unable to execute script "+jsScriptPath+": ");
        console.log(e.message);
        this.outPorts.error.send(e.message);
    }

}

