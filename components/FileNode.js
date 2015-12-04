// FileNode.js

/**
 * This FileNode component is a noflo implementation of the RDF Pipeline FileNode as defined 
 * in the framework: https://github.com/rdf-pipeline/framework/wiki/FileNode-Wrapper
 *
 * In the RDF pipeline, a FileNode represents its state as a file. Its updater is an 
 * executable command, such as a shell script.  It passes on state to other nodes upon processing
 * so that they may also be automatically updated.
 *
 * This FileNode component is configured with an options json object, passed as 
 * input on the "Options" port.  The expected format of that object is: 
 *    { "name": <name of this FileNode instance; this is a required setting>,
 *      "state_file": <path for the state file to be used as backing store for this node; required setting>,
 *      "updater": <path to the FileNode updater used to modify data; this is a required setting>,
 *      "updater_args_template": <template for substituting input values into the updater command line; this is optional" }
 *  It currently uses the updater_args instead of the environment variables documented in the original
 *  framework.
 *
 * The FileNode component will send the following object on its output port upon completion: 
 *     { "name": <name of this FileNode instance>,
 *       "state_file": <path for the state file to be used as backing store for this node>,
 *       "updater_args": <the arguments specified in the input options when updating this FileNode, if there are any.> }
 */

var _ = require('underscore');
var exec = require('child_process').exec;
var fs = require('fs');
var noflo = require('noflo');

exports.getComponent = function() {
    return _.extend(new noflo.Component({


        outPorts: {
            out: {
                description: "State file for this FileNode",
                datatype: 'string',
                required: false,
                addressable: false,
                buffered: false
            },
            error: {
                description: "Error info or Stderr of the file updater script",
                datatype: 'string',
                required: false,
                addressable: false,
                buffered: false
            }
        },
        inPorts: {
            'options': {
                description: "RDF FileNode configuration settings",
                datatype: 'object',
                required: false,
                addressable: false,
                buffered: false,
                process: ondata(assign('options'))
            },
            'in': {
                description: "Source name and initial input file",
                datatype: 'object',
                required: true,
                addressable: false,
                buffered: false,
                process: ondata(execute)
            }
        }
    }), {
        description: "Component for a RDF Pipeline FileNode", 
        icon: 'external-link',

        // The expected input/output port attribute names
        inOutAttrs: { 
            source_name: "name",
            source_file: "file",
            updater_args: "updater_args"
        },

        // FileNode configuration attributes expected to be passed into the options inPort
        optionsAttrs: {
            node_name: "name", 
            node_state_file: "state_file",
            updater: "updater",
            updater_args_template: "updater_args_template"
        }

     });
};

// Set all name value pairs in a json object to members of the current instance and then
// Set an instance member with the name of the original object to true to indicate that this
// input object has been received and processed.
function assign(name){
    return function(data){
        for (var key in data) {
           if (data.hasOwnProperty(key)) { 
              this[key] = data[key];
           }
        }
        // Record that this object was processed 
        this[name] = true;
    };
}

// Handler for any input port data event.  
function ondata(callback) {
    return function(event, payload) {
        switch(event) {
            case 'data': return callback.call(this.nodeInstance, payload);
        };
    };
}

// Once all data has been received, this function executes the RDF FileNode update work
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
        
    // Get a unique array of all values of updater_args  
    var updaterArgs = function(array){
        return _.pluck(array,self.inOutAttrs.updater_args);
    }
    var args = updaterArgs(self.dataArray);
    if ( !  _.isEmpty(args[0])) {
        var unique_updater_args = _.uniq( args,  
                                          function(x) { 
                                              return JSON.stringify( x ); 
                                         });
        for (var u=0, len=unique_updater_args.length; u < len; u++ ) { 
            updaterCmd += " \""+unique_updater_args[u].toString()+"\"";
        }
    }

    if ( self.debug ) {
        console.log("Executing "+updaterCmd);
    }

    exec(updaterCmd, {timeout:3000}, function(error, stdout, stderr) {

        if (error !== null) {
            console.log("error: "+error.toString());
            self.outPorts.error.send(error);
        }

        if (stdout !== null) {
            var stateFile = self.state_file.toString();
            fs.writeFile( stateFile, stdout, function (err) {

                if (err) {
                    self.outPorts.error.send(err);
                    self.outPorts.out.disconnect();
                    return console.log(err);
                }

                console.log("Saved updated node "+self.name+" state to "+stateFile);
                var payload = ( unique_updater_args ) ? 
                              { [self.inOutAttrs.source_name]: self.name, 
                                [self.inOutAttrs.updater_args]: unique_updater_args, 
                                [self.inOutAttrs.source_file]: stateFile } 
                              : { [self.inOutAttrs.source_name]: self.name, 
                                  [self.inOutAttrs.source_file]: stateFile };
                self.outPorts.out.send( payload );
                self.outPorts.out.disconnect();
                if ( self.dataArray ) { 
                    self.dataArray.length = 0;
                }
             });
        }

        if (stderr !== null && stderr.length > 0) {
            console.log("stderr: "+stderr.toString());
            self.outPorts.error.send(stderr);
            self.outPorts.out.disconnect();
         }

         self.outPorts.out.disconnect();
         self.outPorts.error.disconnect();
    });
}
