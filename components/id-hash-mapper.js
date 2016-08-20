 // id-hash-mapper.js
var _ = require('underscore');
var fs = require('fs');
var jsonpointer = require('jsonpointer');

var logger = require('../src/logger');

var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper({isTransient: true,
                          updater: updater});

/**
 * Maps the specified id to another value by generating a hash value to select from 
 * a pool of Ids where the pool distinguishes between female and other genders. 
 * The structure of the hash map is: 
 *    {pool_1: [array of ids],
 *       ...
 *     pool_n: [array of ids]}
 * where the pool name is whatever field the json_pointer resolves to in the
 * json_input.  
 *
 * An example of usage might be a hashmap like this: 
 *    {"female": [id_a, ... id_g],
 *     "male": [id_h, ... id_m],
       "default": [id_n .. id_z]}
 * The json pointer might be used to pull the gender from the json_input, and 
 * would select an id from the correct gender pool of ids.  If there is no 
 * json_pointer match in the hashmap, it will use the "default" pool.   
 *
 * @this vni context
 * @param {required string} id a value to be mapped, e.g., a patient ID value
 * @param {required string} mapfile_envvar an environment variable with the path to the file
 *                 to be processed.
 * @param {object} json_input data associated with the id.  If not provided, an ID will
 *                 be chosen at random from the map
 * @param {string} json_pointer json pointer into the json_input for retrieving 
 *                 the map pool from which to pull an id.  If not provided, an ID will
 *                 be chosen at random from the map. 
 * 
 * @return the mapped value
 */
function updater(id, mapfile_envvar, json_input, json_pointer) {

    if (_.isUndefined(id)) {
        throw Error("Id hash mapper component requires an id to map!");
    }

    var node = this.nodeInstance;

    // Read in the id hash map the first time through this component 
    //  and save it in the node for re-entrant use
    if (_.isUndefined(node.idHashMap)) { 
        var filename = fileName(mapfile_envvar);
        var data = fs.readFileSync(filename).toString();
        if (_.isEmpty(data)) {
            logger.warn('No data found in ' + filename);
            return;
        }
        node.idHashMap = JSON.parse(data);
        if (!_.isObject(node.idHashMap)) 
           throw Error('Id hash mapper component expected a JSON object in the '+mapfile_envvar+' file!');
    }

    // If we have json_input and a json_pointer, get the hash key to use
    // in the map for this pool.  In the example in the function documentation,
    // this might be "male" or "female"
    var hashKey = hashMapKey(json_input, json_pointer);

    if (!_.isEmpty(hashKey)) { 

        // Got a key to use on the map - does it exist? 
        var pool = node.idHashMap[hashKey];
        if (!_.isEmpty(pool)) {
            var index = hashCode(id) % pool.length;
            return pool[index];
        }
    } 

    // Nothing identifying a pool from which ID should be drawn - lump all ids in the hash map object
    // together into one flat array and pick one
    var allIds = _.reduce(_.keys(node.idHashMap), function(memo, key) { 
        return _.flatten(_.union(memo, node.idHashMap[key]));
    }, []);

    if (_.isEmpty(allIds)) 
        throw Error("Id hash mapper component requires at least one id in the " +
                    mapfile_envvar + " file!");

    var index = +hashCode(id) % allIds.length;

    return allIds[index];
}

/**
 * Get the file name from the specified env var.  It is stored in an env
 * var so the file name can be changed without changing the graph config
 * 
 * @param mapfile_envvar an environment variable with the path to the file
 *                    to be processed.
 */
function fileName(mapfile_envvar) {

    if (_.isEmpty(mapfile_envvar))
        throw new Error('Id hash mapper component requires a file environment variable with file to load!');

    var filename = process.env[mapfile_envvar.toString()];
    if (_.isUndefined(filename)) {
        throw Error('Id hash mapper component environment variable ' + mapfile_envvar.toString() + ' is not defined!');
    }

    return filename;
}

/** 
 * Lookup the attribute value to use in this input, to determine which pool of IDs to 
 * get the id for. 
 * 
 * @param json_input data associated with the id.  If not provided, an ID will
 *                 be chosen at random from the map
 * @param json_pointer json pointer into the json_input for retrieving 
 *                     the map pool from which to pull an id.  If not provided, an ID will be chosen
 *                     at random from the map. 
 */
function hashMapKey(json_input, json_pointer ) {
    if (_.isUndefined(json_input) || _.isUndefined(json_pointer)) return;
    return jsonpointer.get(json_input, json_pointer); 
}

/**
 * Generate a numeric hash value based on the input id
 *
 * @param id value to be hashed
 */
function hashCode(id) {

    if (_.isEmpty(id)) return 0;

    var hash = 0, i, chr, len;
    for (i = 0, len = id.length; i < len; i++) {
      chr   = id.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }

    return Math.abs(hash);
};
