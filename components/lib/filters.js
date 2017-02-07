/**
 * filters.js
 * 
 * A library of filters for use in the noflo RDF pipeline component updaters.
 * The filters here are: 
 *   - Filter by literal
 *   - Filter by JSON pointer value
 *   - Filter by attributes
 */

var _ = require('underscore');

var jsonpointer = require('json-pointer');

module.exports = {
    filterByAttributes: filterByAttributes,
    filterByLiterals: filterByLiterals,
    filterByJsonPointers: filterByJsonPointers
};

/**
 * Given an array of json data, extracts the elements the contain the specified key/value attribute
 * pairs.  This API uses a flat match - it will not match on nested elements that match the filter attribute
 * This API is designed to work only with literal filter values - any mix of primitive strings, 
 * numbers or booleans.
 *
 * @param json_data          JSON data to be parsed, and filtered.  It is expects to be an array
 *                           of hash objects.
 * @param filter_attributes  an array of filter attributes to be matched, e.g., 
 *                           [ {name: value}, {name1: value 1, name2: value2} ];
 * @param start              JSON pointer to the place in the data to start filtering
 */
function filterByAttributes(json_data, filter_attributes, start) {
    var data = parseData(json_data, "Filter by attributes API", "JSON data");

    // point to wherever in the data we should start looking.  
    if (!_.isEmpty(start)) { 
        data = jsonpointer.get(data, start);
    }
   
    if (!_.isArray(data)) {
       throw Error('Filter by attributes API expects an array of JSON data to filter!');
    }

    // Parse the filter attributes if they are still strings and verify we got an arry of filters. 
    var filters = parseData(filter_attributes, "Filter by attributes API", "filter JSON data");
    if (!_.isArray(filters)) { 
        throw Error('Filter by attributes API expects an array of attributes to be matched!');
    }

    // Apply each filter to the data to see which data elements match
    return _.flatten(
        _.map(filters, function(filter) { 
            var results = _.where(data, filter);
            return results;
        })
    ); 
}

/**
 * Given an array of json data, extracts the elements the contain the specified literal attributes.
 * This API is designed to work only with literal filter values - any mix of primitive strings, 
 * numbers or booleans.
 *
 * @param json_data          JSON data to be parsed, and filtered.  
 *                           be an array of values
 * @param filter_attributes  an array of filter attributes to be matched.  
 * @param start              JSON pointer to the place in the data to start filtering
 */
function filterByLiterals(json_data, filter_attributes, start) {
    
    var data = parseData(json_data, "Filter by literals API", "JSON data");

    // Adjust to point to wherever in the data we should start filtering 
    // Note this will return relative values
    if (!_.isEmpty(start)) { 
        data = jsonpointer.get(data, start);
    }
   
    if (!_.isArray(data)) {
       throw Error('Filter by literals API expects an array of JSON data to filter!');
    }

    // Parse the filter attributes if they are still strings and verify we have an array of filters
    var filters = parseData(filter_attributes, "Filter by literals API", "filter JSON data");
    if (!_.isArray(filters)) { 
        throw Error('Filter by literals API expects an array of literal filters, i.e., array of strings, numbers, and booleans!');
    }

    // Verify the filters are really literals
    _.each(filters, function(filter) { 
        if (! (_.isString(filter) || _.isNumber(filter) || _.isBoolean(filter))) { 
            throw Error('Filter by literals API expects all filters to be literals.  Received this invalid filter: '+filter+'.');
        }
    });

    // Walk the data array to see which elements match the specified literal filter values
    return _.filter(data, function(element) { 
        return _.some(
            _.map(filters, function(filter) { 
                return (element == filter);  // when true, the element will be kept; when false, the element will be removed from results
            })
        );
    });
}

/**
 * Given an array of json data, extracts the elements the contain the specified JSON Pointer and value.
 * This is the most flexible of the filter APIs because it can match almost any data structure.
 *
 * @param data               Data to be parsed if not already a Javascript object, and filtered.  
 * @param filter_attributes  an array of filters with the format:
 *                              [{jsonpointer: <pointer>, value: <value>}]
 * @param start              JSON pointer to the place in the data to start filtering
 */

function filterByJsonPointers(json_data, filter_attributes, start) {

    var data = parseData(json_data, "Filter by JSON pointers API", "JSON data");

    // Adjust to point to wherever in the data we should start filtering
    // Note this will return relative values
    if (!_.isEmpty(start)) {
        data = jsonpointer.get(data, start);
    }
  
    if (!_.isArray(data)) {
       throw Error('Filter by JSON pointers API expects an array of JSON data to filter!');
    }

    // Parse the filter attributes if they are still strings and verify we have an array of filters
    var filters = parseData(filter_attributes, "Filter by JSON pointers API", "filter JSON data");
    if (!_.isArray(filters)) {
        throw Error('Filter by JSON pointers API expects an array of format [{jsonpointer: <pointer>, value: <value>}]!');
    }

    return _.filter(data, function(element) {
        var matches = _.some(
            _.map(filters, function(filter) {
                // If filter has a json pointer and value, see if we have matching data
                if (!_.isEmpty(filter['jsonpointer']) && !_.isEmpty(filter['value'])) {
                     try {
                         var value = jsonpointer.get(element, filter.jsonpointer);
                         return (!_.isUndefined(value) && filter.value === value );
                     } catch(e) { // normal if no data
                         return false;
                     };
                }
            })
        );
        return matches;
    });
}

/**
 * Verifies that filter received data to filter.  If the data is a string, parses it as JSON
 * to get the equivalent javascript object.  If it is already a non-empty javascript object,
 * just returns it.
 * 
 * @param data data to be checked and parsed.
 * @param filterType filter name whose data is being processed 
 *                    e.g., "Filter by attribute", "Filter by literal"
 * @param dataType description of data being parsed, e.g, JSON data, filter data.
 *                 This is used for more helpful error messages
 */
function parseData(data, filterType, dataType) { 

    if (_.isEmpty(data)) {
        throw Error(filterType + " requires " + dataType + " to parse!");
    }

    try {
        return (_.isString(data)) ? JSON.parse(data) : data;
    } catch (e) {
        throw new Error(filterType + " is unable to parse " + dataType + ": "+e.message+"!");
    }
}