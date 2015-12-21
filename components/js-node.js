// js-node.js

/**
 * This component takes one or more JavaScript objects and executes the specified updater
 * against them to create some kind of merged JavaScript object which may then be passed on 
 * to the next component.
 *
 * See noflo-rdf-pipeline test 0060_Noflo_javascript_updater for an example.
 */

var _ = require('underscore');
var fs = require('fs');
var noflo = require('noflo');

var BaseFileNode = require('./base-file-node');

exports.getComponent = function() {
    return _.extend(
      new noflo.Component(
               _.extend( {},
                         BaseFileNode.defaultPorts,
                         { inPorts: {
                             options: {
                                 description: "Node configuration settings",
                                 datatype: 'object',
                                 required: false,
                                 addressable: false,
                                 buffered: false,
                                 process: BaseFileNode.ondata(BaseFileNode.assign('options'))
                             },
                             in: {
                                 description: "Source name and Javascript object input",
                                 datatype: 'object',
                                 required: true,
                                 addressable: false,
                                 buffered: false,
                                 process: BaseFileNode.ondata(execute)
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
        },

        // file-node configuration attributes expected to be passed into the options inPort
        optionsAttrs: {
            nodeName: "name",
            stateFile: "stateFile",
            updater: "updater",
            updaterArgsTemplate: "updaterArgsTemplate"
        }
     });
}

// Once all data has been received, this function executes the RDF file-node update work
// and passes on the results to the next component(s).
function execute(data) {

    if ( ! this.options ) {
        return _.defer(execute.bind(this, data));
    }

    if (this.debug) {
        console.log("Executing js-node "+ this.name);
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

    if (!this.name || !this.updater )  {
        throw new Error("Execute options are missing required settings.");
    }

    var stateFile = (this.stateFile) ? this.stateFile :
                        BaseFileNode.defaultStateFile( this.name, process );;

    var jsScriptPath = process.cwd()+"/"+this.updater;

    // Get a unique array of all values of updaterArgs from input
    var unique_updaterArgs = BaseFileNode.uniqElemsWithAttr( this.dataArray, 
                                                             this.inOutAttrs.updaterArgs );

    var self = this;

    try { 

        // Execute the javascript updater
        var myScript = require( jsScriptPath );
        var result = myScript.execute( this.dataArray.concat( unique_updaterArgs ));
        if ( this.debug ) { 
            console.log("result: ", JSON.stringify(result));
        }

        // write the resulting object to the state file and send it to the next component
        if ( result ) { 
            var sendPayload = { [self.inOutAttrs.sourceName]: self.name,
                                [self.inOutAttrs.sourceJsObject]: result };
            BaseFileNode.writeStateFile( stateFile, 
                                         JSON.stringify(result),
                                         self.outPorts,
                                         sendPayload );
            if ( self.dataArray ) {
                self.dataArray.length = 0;
            }
        }

    } catch(e) { 
        console.log("Unable to execute script "+jsScriptPath+": ");
        console.log(e.message);
        self.outPorts.error.send(e.message);
    }

}

