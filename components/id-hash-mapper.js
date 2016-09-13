 // id-hash-mapper.js
var _ = require('underscore');
var fs = require('fs');
var jsonpointer = require('jsonpointer');

var lm = require('../src/create-lm');
var stateFactory = require('../src/create-state');
var logger = require('../src/logger');

var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper({description: "Maps one id into another, using a json pointer extracted "
                                       + "field in the json input to determine the mapped id; "+
                                       + "this map does not require one entry per id.",
                          icon: 'map',
                          isTransient: true,
                          updater: updater});

/**
 * Maps the specified id to another value by generating a hash value to select from 
 * a pool of Ids where the pool distinguishes between female and other genders. 
 * The structure of the hash map is: 
 *    {pool_1: [array of ids],
 *       ...
 *     pool_n: [array of ids]}
 * where the pool name is whatever field the json_pointer resolves to in the
 * input.  
 *
 * An example of usage might be a hashmap like this: 
 *    {"female": [id_a, ... id_g],
 *     "male": [id_h, ... id_m],
       "default": [id_n .. id_z]}
 * The json pointer might be used to pull the gender from the input, and 
 * would select an id from the correct gender pool of ids.  If there is no 
 * json_pointer match in the hashmap, it will use the "default" pool.   
 *
 * @this vni context
 * @param {required string} id a value to be mapped, e.g., a patient ID value
 * @param {required string} mapfile_envvar an environment variable with the path to the file
 *                 to be processed.
 * @param {object} input data associated with the id.  If not provided, an ID will
 *                 be chosen based on a hash into the entire map. 
 * @param {array} json_pointers an array of json pointer into the input for retrieving 
 *                 the map pool from which to pull an id.  If not provided, an ID will
 *                 be chosen based on a hash into the entire map. 
 * 
 * @return the mapped value
 */
function updater(id, mapfile_envvar, input, json_pointers) {

    if (_.isUndefined(id)) {
        throw Error("Id hash mapper component requires an id to map!");
    }

    var jsonPointers = (_.isString(json_pointers) && !_.isEmpty(json_pointers)) ? JSON.parse(json_pointers) : json_pointers;

    var node = this.nodeInstance;

    // Read in the id hash map the first time through this component 
    //  and save it in the node for re-entrant use
    if (_.isUndefined(node.idHashMap)) { 
        var filename = fileName(mapfile_envvar);
        var data = fs.readFileSync(filename, 'UTF-8');
        if (_.isEmpty(data)) {
            logger.warn('No data found in ' + filename);
            return;
        }
        node.idHashMap = JSON.parse(data);
        if (!_.isObject(node.idHashMap)) 
           throw Error('Id hash mapper component expected a JSON object in the '+mapfile_envvar+' file!');
    }

    // If we have input and a json_pointer(s), get the hash key to use
    // in the map for this pool.  In the example in the function documentation,
    // this might be "male" or "female"
    var hashKey = hashMapKey(input, jsonPointers);

    if (!_.isEmpty(hashKey)) { 

        hashKey = hashKey.toUpperCase(); // convert to uppercase since data may vary

        // Got a key to use on the map - does it exist? 
        var pool = node.idHashMap[hashKey];
        if (!_.isEmpty(pool)) {
            var index = hashCode(id) % pool.length;
            // sendIt.call(this, pool[index]);
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

    var index = hashCode(id) % allIds.length;

    // sendIt.call(this, allIds[index]);
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
        throw new Error('Id hash mapper component requires a map file environment variable with a file to load!');

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
 * @param input data associated with the id.  If not provided, an ID will
 *                 be chosen at random from the map
 * @param json_pointers json pointer into the input
 */
function hashMapKey(input, json_pointers ) {
    if (_.isEmpty(input) || _.isEmpty(json_pointers)) return;

    // Might want an array of json pointers if there can be multiple values e.g.,
    // gender, sex-1, sex-2, etc.
    if (_.isArray(json_pointers)) {
        for (var i=0; i < json_pointers.length; i++) {
            var result = jsonpointer.get(input, json_pointers[i]); 
            if (!_.isEmpty(result)) return result;
        }
        return;
    } 

    // Just one json pointer so return whatever it has
    return jsonpointer.get(input, json_pointers); 
}

/**
 * Generate a numeric hash value based on the id string
 *
 * @param {string} id value to be hashed
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
}
