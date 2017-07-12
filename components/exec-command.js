// execute-command.js

var _ = require('underscore');
var exec = require('child_process').exec;

var wrapper = require('../src/javascript-wrapper');
module.exports = wrapper({
    description: "Execute a command.",
    icon: 'play',
    inPorts: {
         command: {
             description: "shell command to execute",
             datatype: 'string',
         },
         optional_args: {
             description: "optional arguments, e.g., -l",
             datatype: 'string',
         },
         positional_args: {
             description: "positional command arguments, e.g., a file name",
             datatype: 'string',
         }
     },
     isTransient: true,
     updater: executeCommand});

/**
 * Executes a command from a shell and returns whatever was in stdout
 * 
 * @this vni context
 * @param command to be executed
 * @param optionalArgs optional command line arguments e.g., -x
 * @param positionalArgs positional command line arguments e.g., the file on ls file
 * 
 * @return data object that contacts the error code and whatever is 
 *              returned in stdout and stderr
 */
function executeCommand(command, optional_args, positional_args ) {

    if (_.isEmpty(command)) { 
        throw Error('Execute command component requires a command to execute!');
    } 

    var optArgs = optional_args || '';
    var posArgs = positional_args || '';
    var cmd = command + ' ' + optArgs + ' ' +  posArgs;

    return new Promise(function(resolve){
        return exec(cmd, function (error, stdout, stderr) {
            resolve({ error: error, 
                      stdout: stdout,
                      stderr: stderr });
        });
    });
}
