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
var debug = false;

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
                              sendPayload,
                              callback ) { 

        if ( this.debug ) {
          console.log("Saving state to "+stateFile);
        }

        fs.writeFile( stateFile, nodeState, function (err) {

          if (err) {

            if ( outPorts && outPorts.error ) { 
              outPorts.error.send(err);
              outPorts.error.disconnect();
            }

          } else if ( outPorts && outPorts.out ) { 
            outPorts.out.send( sendPayload );
            outPorts.out.disconnect();
          }

          if ( _.isFunction(callback)) {
            callback( stateFile, err );
          }
        }); 
    },

    /**
     * Forks the specified command and waits until it returns.  
     * Sends the results to the next component.
     */
     execute: function( command, 
                        nodeName,
                        stateFile, 
                        outPorts,
                        sendPayload, 
                        callback) {

        var self = this;
        exec(command, {timeout:3000}, function(error, stdout, stderr) {

            if ((error || stderr) && outPorts && outPorts.error) { 

                if (error) {
                  outPorts.error.send(error);
                } 

                if (stderr) { 
                  outPorts.error.send(stderr);
                }

                outPorts.error.disconnect();
            }

            if (stdout !== null ) {

                if (stateFile && stateFile.length > 0) { 

                  self.writeStateFile( stateFile, 
                                       stdout, 
                                       outPorts,
                                       sendPayload, 
                                       function( stateFile, err ) { 
                    if ( ! error ) {
                      error = err;
                    }
                    if ( _.isFunction(callback) ) {
                      callback( stateFile, error );
                    }
                  });

                } else {
                  if (outPorts && outPorts.out) { 
                    outPorts.out.send( sendPayload );
                    outPorts.out.disconnect();
                  }

                  if ( _.isFunction(callback) ) {
                    callback( stateFile, error );
                  }
                }
           }

        });
    }, 
                          
    /**
     * Simplistic check to see if the updater requested is an javascript file that can be
     * required and executed, or if it's a command line that needs to be forked.
     */
    isJsFile: function( string ) {

      var cleanString = string.trim().replace("\\ ","");
      if ( cleanString.toLowerCase().endsWith(".js") ) { 
         return (cleanString.indexOf(" ") < 0);
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
        var elements = _.pluck(array, attrName).filter(function(x) {
                           // filter out any undefineds (objects in array that don't have attribute we want)
                           return (x);
                       });

        // if we got any elements, de-dup the list to be sure there is only one for each
        if ( !  _.isEmpty(elements)) {

           uniqueElements = _.uniq( elements,
                                    function(x) {
                                        if (x) {
                                          return JSON.stringify( x );
                                        }
                                    });
        }
        return _.flatten(uniqueElements);
    }

};

