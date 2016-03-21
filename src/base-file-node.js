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
      return process.cwd() + '/state/';
  },

  /** 
   * default state file name if the user did not configure a state file 
   * for a node.
   *
   * @param nodeName name of the RDF component node executing this command
   * @param process handle to the node.js global process context
   */
  defaultStateFile: function( nodeName, process ) {
    return this.defaultStateFilePath() + nodeName;
  },

  debug: this.debug,

  /**
   * Forks the specified command and waits until it returns.  
   * Sends the results to the next component.
   *
   * @param command to be executed from a forked shell
   * @param nodeName name of the RDF component node executing this command
   * @param stateFilePath canonical path to the state file to be written
   * @param outPorts noflo output ports; minimally, there should be an out port 
   *        and an error port. 
   * @param sendPayload content to be sent after success state update to the next 
   *        noflo component node.
   * @param callback optional callback function to be executed upon completion. 
   */
  execute: function( command, 
                     nodeName,
                     stateFilePath, 
                     outPorts,
                     sendPayload, 
                     callback) {

    if (this.debug) {
      console.log("Executing command "+ command+" for node "+nodeName);
    }

    var self = this;
    exec(command, {timeout:3000}, function(error, stdout, stderr) {

      // Got any errors?  If so, report them 
      if (error || stderr) { 

        self.handleErrors( [ error, stderr ], outPorts );
        if ( _.isFunction(callback) ) {
          if ( !error ) error = new Error(stderr);
          callback( error, stateFilePath);
        }

      } else // if we have stdout and a state file to write to, then write it
      if ( stdout && (stateFilePath && stateFilePath.length > 0)) { 

          self.writeStateFile( stateFilePath, 
                               stdout, 
                               outPorts,
                               sendPayload, 
                               function( err, stateFile ) { 

            if ( _.isFunction(callback) ) {
              if ( ! error ) error = err;
              callback( error, stateFile );
            }
          });

      } else {
      
        // No errors, state file or stdout -> just send payload to next
        // noflo component and callback that we are done
        outPorts.out.send( sendPayload );
        outPorts.out.disconnect();
        if ( _.isFunction(callback) ) {
          callback( error, stateFilePath );  
        }
      }
    });
  }, 
                          
  handleErrors: function( errors, outPorts ) {

    if (errors && errors.length > 0  ) { 
      for (var i = 0, len=errors.length; i < len; i++) {
        outPorts.error.send(errors[i]);
      }
      outPorts.error.disconnect();
    }
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

    var results =  _.flatten(uniqueElements);
    if ( this.debug ) { 
       console.log("Unique elements with attribute "+attrName+": "+results);
    }

    return results;
  },

  /** 
   * Write node state to disk and forward the node state and any other payload content
   * to the next noflo component.  This will overwrite whatever was previously in the 
   * state file.
   *
   * @param stateFilePath canonical path to the state file to be written.  
   * @param filePayload node state content to be written to the state file.
   * @param outPorts noflo output ports; minimally, there should be an out port 
   *        and an error port. 
   * @param sendPayload content to be sent after success state update to the next 
   *        noflo component node.
   * @param callback optional callback function to be executed upon completion. 
   */
  writeStateFile: function( stateFilePath,
                            filePayload, 
                            outPorts, 
                            sendPayload,
                            callback) { 

    if ( this.debug ) {
      console.log("Saving state to " + stateFilePath);
    }

    var self = this;
    fs.writeFile( stateFilePath, filePayload, function(error) {

      if (error) {
        self.handleErrors( [ error ], outPorts );

      } else {
        outPorts.out.send( sendPayload );
        outPorts.out.disconnect();
      }

      if ( _.isFunction(callback)) {
        callback( error, stateFilePath );
      }
    }); 
  }

};

