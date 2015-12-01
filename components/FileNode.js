// FileNode.js

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
            name: {
                description: "Name of this FileNode.  Should be unique within a pipeline.",
                datatype: 'string',
                required: true,
                addressable: false,
                buffered: false,
                process: ondata(assign('name'))
            }, 
            state_file: {
                description: "File path to the node state file.",
                datatype: 'string',
                required: true,
                addressable: false,
                buffered: false,
                process: ondata(assign('state_file'))
            }, 
            updater: {
                description: "File path to the node updater.",
                datatype: 'string',
                required: true,
                addressable: false,
                buffered: false,
                process: ondata(assign('updater'))
            }, 
            'in': {
                description: "File input - An initial input file",
                datatype: 'string',
                required: true,
                addressable: false,
                buffered: false,
                process: ondata(execute)
            }
        }
    }), {
        description: "Component for a RDF Pipeline FileNode,\
            using file updater script from the @in port",
        icon: 'external-link'
    });
};

function assign(name){
    return function(data){
        this[name] = data;
    };
}

function ondata(callback) {
    return function(event, payload) {
        switch(event) {
            case 'data': return callback.call(this.nodeInstance, payload);
        };
    };
}

function execute(data) {

        if (!this.name || !this.state_file || !this.updater || !data) 
            throw new Error("Execute called with missing data.");
	var self = this;
       
        var updaterCmd = this.updater + " " + data;

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
                  console.log("Saved updated node state to "+stateFile);
                  self.outPorts.out.send(stateFile);
                  self.outPorts.out.disconnect();
               });
           }

           if (stderr !== null && stderr.length > 0) {
             console.log("stderr: "+stderr.toString());
             self.outPorts.error.send(stderr);
             self.outPorts.out.disconnect();
           }

           // Revisit 
           self.outPorts.out.disconnect();
           self.outPorts.error.disconnect();
        });
}
