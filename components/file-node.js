// file-node.js

/**
 * This file-node component is a noflo implementation of the RDF Pipeline file-node as defined 
 * in the framework: https://github.com/rdf-pipeline/framework/wiki/file-node-Wrapper
 *
 * In the RDF pipeline, a file-node represents its state as a file. Its updater is an 
 * executable command, such as a shell script.  It passes on state to other nodes upon processing
 * so that they may also be automatically updated.
 *
 * This file-node component is configured with an options json object, passed as 
 * input on the "Options" port.  The expected format of that object is: 
 *    { "name": <name of this file-node instance; this is a required setting>,
 *      "state_file": <path for the state file to be used as backing store for this node; required setting>,
 *      "updater": <path to the file-node updater used to modify data; this is a required setting>,
 *      "updaterArgs_template": <template for substituting input values into the updater command line; this is optional" }
 *  It currently uses the updaterArgs instead of the environment variables documented in the original
 *  framework.
 *
 * The file-node component will send the following object on its output port upon completion: 
 *     { "name": <name of this file-node instance>,
 *       "state_file": <path for the state file to be used as backing store for this node>,
 *       "updaterArgs": <the arguments specified in the input options when updating this file-node, if there are any.> }
 */

var _ = require('underscore');
var exec = require('child_process').exec;
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
                                 process: basenode.on({data: basenode.assign('options')})
                             },
                             in: {
                                 description: "Source name and Json source input file",
                                 datatype: 'object',
                                 required: true,
                                 addressable: false,
                                 buffered: false,
                                 process: basenode.on({data: handle})
                               }
                             }
                         })),
      { description: "Component for a RDF Pipeline file-node", 
        icon: 'external-link',

        // The expected input/output port attribute names
        inOutAttrs: { 
            sourceName: "name",
            sourceFile: "file",
            updaterArgs: "updater_args"
        }

      });
};


// Once all data has been received, this function handles the RDF file-node update work
// and passes on the results to the next component(s).
function handle(data) {

    if ( ! this.options ) {
        return _.defer(handle.bind(this, data));
    }

    if (this.options.debug) {
        console.log("Executing file-node "+ this.options.name);
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

    var updaterCmd = this.options.updater;
    if ( this.options.updater_args_template ) { 

        var templateArgs = this.options.updater_args_template.match(/\$\w+/g);
        var templatedArgs = this.options.updater_args_template;

        function applyToTemplate( target, replacement, template ) {
            var pattern = new RegExp( "\\"+target );
            return template.replace( pattern, replacement );
        }

        for (var i=0; i < templateArgs.length; i++ ) { 
            var templateArg = templateArgs[i];
            var templateVarName = templateArg.substring(1); // strip leading $ char
            var replacementVal = _.findWhere(this.dataArray, {name: templateVarName});
            templatedArgs = applyToTemplate( templateArg, replacementVal.file, templatedArgs ); 
        }
         
        updaterCmd += " " + templatedArgs;
    } else { 
        updaterCmd += " "+ data.file;
    }
        
    // Get a unique array of all values of updaterArgs from input
    var unique_updaterArgs = basefnode.uniqElemsWithAttr( this.dataArray,
                                                          this.inOutAttrs.updaterArgs );
    updaterCmd += " '" + unique_updaterArgs.join("' ") + "'";

    if ( this.options.debug ) {
        console.log("Executing "+updaterCmd);
    }

    var payload = ( unique_updaterArgs ) ? 
                    { [this.inOutAttrs.sourceName]: this.options.name, 
                      [this.inOutAttrs.updaterArgs]: unique_updaterArgs, 
                      [this.inOutAttrs.sourceFile]: stateFile } 
                  : { [this.inOutAttrs.sourceName]: this.options.name, 
                      [this.inOutAttrs.sourceFile]: stateFile };

    // Execute the updater with the configured settings
    basefnode.execute( updaterCmd, 
                       this.options.name, 
                       stateFile, 
                       this.outPorts, 
                       payload );

    if ( this.dataArray ) { 
        this.dataArray.length = 0;
    }
}
