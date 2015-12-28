// base-file-node.js

/**
 * This file contacts the common code used by all of the variations of a RDF
 * file-node component in the noflo implementation of the RDF Pipeline
 * FileNode.  More details about the RDF pipeline are available here:
 * https://github.com/rdf-pipeline/framework/wiki/file-node-Wrapper
 */

var _ = require('underscore');
var fs = require('fs');
var exec = require('child_process').exec;

var basenode = require('./base-node');

module.exports = {

    defaultStateFilePath: function() {
        if ( process ) {
            return process.cwd() + '/state/';
        } 

        return '/tmp/state/';
    },

    /** 
     * default state file name if the user did not configure a state file for a node.
     */
    defaultStateFile: function( nodeName, process ) {
        return this.defaultStateFilePath() + nodeName;
    },

    /** 
     * Write node state to disk and forward the node state and any other payload content
     *  to the next noflo component.
     */
    writeStateFile: function( stateFile,
                              nodeState, 
                              outPorts, 
                              sendPayload ) { 

        console.log("Saving state to "+stateFile);
        fs.writeFile( stateFile, nodeState+"\n", function (err) {

          if (err) {
            console.log(err);
            outPorts.error.send(err);
            outPorts.error.disconnect();
          }

          outPorts.out.send( sendPayload );
          outPorts.out.disconnect();
        }); 
    },

    /**
     * Forks the specified command and waits until it returns.  
     * Sends the results to the next component.
     */
     execUpdater: function( command, 
                            nodeName,
                            stateFile, 
                            outPorts,
                            sendPayload) {

        var self = this;
        exec(command, {timeout:3000}, function(error, stdout, stderr) {

            if (error !== null) {
                console.log("error: "+error.toString());
                outPorts.error.send(error);
                outPorts.out.disconnect();
                return console.log( err );
            }

            if (stderr !== null && stderr.length > 0) {
                console.log("stderr: "+stderr.toString());
                basenode.outPorts.error.send(stderr);
                basenode.outPorts.out.disconnect();
                return console.log( stderr );
            }

            if (stdout !== null) {
                self.writeStateFile( stateFile, 
                                     stdout, 
                                     outPorts,
                                     sendPayload );
           }

        });
    }, 
                          
    /**
     * Simplistic check to see if the updater requested is an javascript file that can be
     * required and executed, or if it's a command line that needs to be forked.
     */
    isJsFile: function( string ) {

      if ( string.toLowerCase().endsWith(".js") ) { 
         return ( 0 > string.trim().replace("\\ ","").indexOf(" "));
      }

      return false;
    },


    /**
     * Given an array of objects, and an attribute name, this function returns 
     * an array of all the objects that contain the attribute, with any duplicates
     * removed.
     */
    uniqElemsWithAttr: function( array, attrName ) { 

        var uniqueElements = [];

        // Get elements in array with the specified attribute
        var elements = _.pluck(array, attrName);

        // if we got any elements, de-dup the list to be sure there is only one for each
        if ( !  _.isEmpty(elements)) {
           uniqueElements = _.uniq( elements,
                                    function(x) {
                                        return JSON.stringify( x );
                                    });
        }
        return uniqueElements;
    }

};

