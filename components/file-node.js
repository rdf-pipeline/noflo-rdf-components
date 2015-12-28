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
 *      "updater_args_template": <template for substituting input values into the updater command line; this is optional" }
 *  It currently uses the updater_args instead of the environment variables documented in the original
 *  framework.
 *
 * The file-node component will send the following object on its output port upon completion: 
 *     { "name": <name of this file-node instance>,
 *       "state_file": <path for the state file to be used as backing store for this node>,
 *       "updater_args": <the arguments specified in the input options when updating this file-node, if there are any.> }
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
      { description: "Component for a RDF Pipeline file-node", 
        icon: 'external-link',

        // The expected input/output port attribute names
        inOutAttrs: { 
            source_name: "name",
            source_file: "file",
            updater_args: "updater_args"
        },

        // file-node configuration attributes expected to be passed into the options inPort
        optionsAttrs: {
            node_name: "name", 
            node_state_file: "state_file",
            updater: "updater",
            updater_args_template: "updater_args_template"
        }

      });
};


// Once all data has been received, this function executes the RDF file-node update work
// and passes on the results to the next component(s).
function execute(data) {

    if (this.debug) {
        console.log("Execute("+data.name+" with file "+data.file+")");
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

    // Do we have all the input we need to proceed?  
    if ( ! this.options || ! data ) { 
        return _.defer(execute.bind(this, data));
    }

    if (!this.name || !this.state_file || !this.updater )  {
        throw new Error("Execute options are missing required settings.");
    }

    var self = this;

    var stateFile = (self.stateFile) ? self.stateFile :
                     basefnode.defaultStateFile( self.name, process );

    var updaterCmd = self.updater;
    if ( self.updater_args_template ) { 

        var templateArgs = self.updater_args_template.match(/\$\w+/g);
        var templatedArgs = self.updater_args_template;

        function applyToTemplate( target, replacement, template ) {
            var pattern = new RegExp( "\\"+target );
            return template.replace( pattern, replacement );
        }

        for (var i=0; i < templateArgs.length; i++ ) { 
            var templateArg = templateArgs[i];
            var templateVarName = templateArg.substring(1); // strip leading $ char
            var replacementVal = _.findWhere(self.dataArray, {name: templateVarName});
            templatedArgs = applyToTemplate( templateArg, replacementVal.file, templatedArgs ); 
        }
         
        updaterCmd += " " + templatedArgs;
    } else { 
        updaterCmd += " "+ data.file;
    }
        
    // Get a unique array of all values of updaterArgs from input
    var unique_updaterArgs = basefnode.uniqElemsWithAttr( this.dataArray,
                                                          this.inOutAttrs.updaterArgs );
    updaterCmd += unique_updaterArgs.join(' ');

    if ( self.debug ) {
        console.log("Executing "+updaterCmd);
    }

    var payload = ( unique_updaterArgs ) ? 
                    { [self.inOutAttrs.source_name]: self.name, 
                      [self.inOutAttrs.updater_args]: unique_updaterArgs, 
                      [self.inOutAttrs.source_file]: stateFile } 
                  : { [self.inOutAttrs.source_name]: self.name, 
                      [self.inOutAttrs.source_file]: stateFile };
    basefnode.execUpdater( updaterCmd, self.name, stateFile, self.outPorts, payload );
    if ( self.dataArray ) { 
        self.dataArray.length = 0;
    }
}
