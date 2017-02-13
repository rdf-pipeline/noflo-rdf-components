/**
 * data-utils.js
 *
 * A library of data input APIs for use in the noflo RDF pipeline component updaters.
 */

var _ = require('underscore');
var fs = require('fs');

module.exports = {
    parseData: parseData,
    readFileData: readFileData,
    readJsonData: readJsonData
};

/**
 * If the data is a string, parses it as JSON  to get the equivalent javascript object.  
 *If it is already a non-empty javascript object, it just returns it.
 *
 * @param data            data to be checked and parsed.
 * @param callerName name of the caller code e.g., component name or API name.
 * @param dataDescription a description of the data in the file being read.
 *
 * @return the data as a javascript object 
 */
function parseData(data, callerName, dataDescription) {

    var caller = callerName || "parseData API";
    var description = dataDescription || "data";
      
    if (_.isEmpty(data)) {
        throw Error(caller + " requires " + description + " to parse!");
    }

    try {
        return (_.isString(data)) ? JSON.parse(data) : data;
    } catch (e) {
        throw new Error(caller + " is unable to parse " + description + ": "+e.message+"!");
    }
}

/**
 * Reads the specified file and returns the content 
 * 
 * @param filename file to be read
 * @param encoding file encoding.  Defaults to utf-8
 * @param callerName name of the caller code e.g., component name or API name.
 * @param dataDescription a description of the data in the file being read.
 *
 * @return the file contents
 */
function readFileData(filename, encoding, callerName, dataDescription) { 

    var caller = callerName || "readFileData API";
    var description = dataDescription || "";
    description = (description.length > 1)  ? description + " " : description;
      
    if (_.isEmpty(filename)) {
        throw Error(caller + " requires a " + description + "file name!");
    }

    try { 
        return fs.readFileSync(filename, encoding || 'utf-8');
    } catch(e) { 
        throw new Error(caller + " is unable to read file " + filename + ": " + e.message);
    }
}

/**
 * Reads the specified file and parses its contents as JSON. 
 *
 * @param filename file to be read
 * @param encoding file encoding.  Defaults to utf-8
 * @param callerName name of the caller code e.g., component name or API name.
 * @param dataDescription a description of the data in the file being read.
 *
 * @return the file contents as a Javascript object or an exception if reading or parsing fails
 */ 
function readJsonData(filename, encoding, callerName, dataDescription) {
    var caller = callerName || "readJsonData API";
    var description = dataDescription || "";

    return parseData( 
        readFileData(filename, encoding, caller, description),
        caller,
        dataDescription
    );
}
