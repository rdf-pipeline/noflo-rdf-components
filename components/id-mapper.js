 // id-mapper.js
var _ = require('underscore');

var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper({description: "Maps one ID into another, using the map; all ids must have an entry in the map.",
                          icon: 'arrows-h',
                          isTransient: true,
                          updater: idMapper});


/**
 * Maps the specified id to another value using the specified map.
 * This is useful when mapping from an ID on one system (e.g., patient ID) to 
 * an ID from another system, which may or may not even have the same attribute name 
 * for the id.
 *
 * @this vni context
 * @param id a value to be mapped, e.g., a patient ID value
 * @param map a JavaScript object that contains the map with a format like
 *        {"1":"10", "2":"20", ...  "9":"90"}
 *        where 1 is mapped to 10, 2 to 20, etc.
 * 
 * @return the mapped value
 */
function idMapper(id, map) {

    if (_.isUndefined(id)) {
        throw Error("Id-mapper component requires an id to map!");
    }

    if (_.isEmpty(map)) {
        throw Error("Id-mapper component cannot map ids with an undefined or empty map!");
    }

    // Input can come in as a string containing JSON, or as an already parsed object.
    // If it's a string, parse it so we have the object to use
    var parsedMap = (_.isString(map)) ? JSON.parse(map) : map;

    // Find the first entry in the map that matches the specified id
    if (_.isUndefined(parsedMap[id])) { 
        throw Error('Id-mapper did not find id "'+id+'" in the map!'); 
    }

    return parsedMap[id];
}

