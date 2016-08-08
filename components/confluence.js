// confluence.js

var _ = require('underscore');

var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper({ 
                           description: "Waits for input from all edges and returns an array of the values",
                           icon: 'cogs',
                           inPorts: {
                               input: {
                                   datatype: 'all',
                                   multi: true
                               }
                           },
                           updater: confluence
                        });

/**
 * Gathers the data from all input edges and then forwards an array with each of those input values.  This 
 * component can be useful for synchronizing multiple inputs into a common stream for downstream components,
 * acting much like the confluence of rivers.
 * 
 * @this vni context
 * @param input the input port to which all edges should be attached.
 * 
 * @return an array with all of the input values
 */
function confluence(input) {

    var result = _.isArray(input) ? input : [input];
    return result;
}
