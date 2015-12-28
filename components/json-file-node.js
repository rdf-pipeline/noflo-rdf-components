// json-file-node.js

/**
 * This json-file-node parses the specified json file into a javascript object and 
 * sends it on to the next component for further processing.   If a javascript updater
 * was configured, it will be executed to update the original json javascript object
 * prior to sending it on. 
 *
 * Configuration is specified using with an options json object, passed as 
 * input on the "Options" port.  The expected format of that object is: 
 *    { "name": <name of this file-node instance; this is a required setting>,
 *      "updater": <path to the javascript updater used to modify data; this is a required setting> }
 *
 * The json-file-node component will send the following object on its output port upon completion: 
 *     { "name": <name of this file-node instance>,
 *       "jsObject": <path for the state file to be used as backing store for this node>,
 *       "updaterArgs": <the arguments specified in the input options when updating this file-node, if there are any.> }
 */

var _ = require('underscore');
var fs = require('fs');
var noflo = require('noflo');

var basenode = require('./base-node');
var basefnode = require('./base-file-node');

exports.getComponent = function() {
    return _.extend(
      new noflo.Component( _.extend( {},
                         basenode.defaultPorts,
                         { inPorts: {
                             options: {
                                 description: "Node configuration settings",
                                 datatype: 'object',
                                 required: false,
                                 addressable: false,
                                 buffered: false,
                                 process: basenode.ondata(basenode.assign('options'))
                             },
                             in: {
                                 description: "Source name and Json source input file",
                                 datatype: 'object',
                                 required: true,
                                 addressable: false,
                                 buffered: false,
                                 process: basenode.ondata(execute)
                               }
                             }
                         })),
      {
        description: "Component for a RDF Pipeline js-file-node",
        icon: 'external-link',

        // The expected input port attribute names
        inAttrs: {
            sourceName: "name",
            sourceFile: "file",
            updaterArgs: "updaterArgs"
        },

        // The expected input port attribute names
        outAttrs: {
            sourceName: "name",
            sourceJsObject: "js_object",
            updaterArgs: "updaterArgs"
        },

        // file-node configuration attributes expected to be passed into the options port
        optionsAttrs: {
            node_name: "name",
            updater: "updater",
        }

     });
}


// Once all data has been received, this function executes the RDF file-node update work
// and passes on the results to the next component(s).
function execute(data) {

    // Do we have all the input we need to proceed?
    if ( ! this.options ) {
        return _.defer(execute.bind(this, data));
    }

    if ( this.debug ) { 
        console.log("\njson-file-node processing "+this.name);
    }

    var self = this;


    try { 

        // Parse the json file specfied into a javascript object
        var jsonFilePath = process.cwd() + "/" + data.file;
        var jsObject =  JSON.parse(fs.readFileSync(jsonFilePath));

        if ( this.updater ) { 
            if ( basefnode.isJsFile( this.updater ) ) { 

                // execute a javascript updater file
                var scriptPath = process.cwd()+"/"+this.updater;
                var myScript = require( scriptPath );

                var result = ( data.updaterArgs ) ? myScript.execute( { "args": data.updaterArgs, 
                                                                         "jsObject": jsObject } ) : 
                                                    myScript.execute( { "jsObject": jsObject } );

                if ( result ) {

                     var stateFile = 
                         (self.stateFile) ? self.stateFile : 
                             basefnode.defaultStateFile( this.name, process );

                     var sendPayload = 
                         ( data.updaterArgs ) ? { [self.outAttrs.sourceName]: self.name,
                                                   [self.outAttrs.updaterArgs]: data.updaterArgs,
                                                   [self.outAttrs.sourceJsObject]: result } 
                                               : 
                                                   { [self.outAttrs.sourceName]: self.name,
                                                     [self.outAttrs.sourceJsObject]: result };

                     basefnode.writeStateFile( stateFile,
                                                  JSON.stringify(result),
                                                  self.outPorts,
                                                  sendPayload ); 

                } else {
                     // No result after executing the updater - this is not good
                     throw new Error("Nothing found after executing "+this.updater);
                }

             } else {
                // Don't have a javascript updater - this is an error!
                throw new Error( "Expected a javascript updater but found " + 
                                 this.updater + ".  Please check the configuration.");
             }

        } else {
            // No updater configured - go ahead and send whatever json object we parsed  
            this.outPorts.out.send( { [this.outAttrs.sourceName]: this.name,
                                      [this.outAttrs.sourceJsObject]: jsObject } );
        } 

        if ( this.outPorts.out.isConnected() ) { 
            this.outPorts.out.disconnect();
        }

    } catch(e) { 
        var errMsg = "Unable to process json file "+jsonFilePath+": \n" + e.message;
        console.log(errMsg);
        this.outPorts.error.send(errMsg);
        this.outPorts.error.disconnect();
    } 
}

