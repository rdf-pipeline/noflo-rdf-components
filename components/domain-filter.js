// domain-filter.js

var _ = require('underscore');

var filterLib = require('./lib/filters');
var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper({description: "Filters Json-LD data to extract elements of interest.",
                          icon: "filter",
                          updater: filter});

var FILTER_TEMPLATES = {
    "demographics": [{"jsonpointer": "/type", "value": "<prefix>:Patient-2"}],
    "diagnoses": [{"jsonpointer": "/type", "value": "<prefix>:Kg_Patient_Diagnosis-100417"}], 
    "labs": [{"jsonpointer": "/type", "value": "<prefix>:Lab_Result-63"},
             {"jsonpointer": "/type", "value": "<prefix>:Medication_Profile-8810_3"},
             {"jsonpointer": "/type", "value": "<prefix>:Order-101"},
             {"jsonpointer": "/type", "value": "<prefix>:Patient_Appointment-44_2"}],
    "prescriptions": [{"jsonpointer": "/type", "value": "<prefix>:Prescription-52"}],
    "procedures": [{"jsonpointer": "/type", "value": "Procedure"}],
};

/**
 * Given an array of json data, extracts the elements the contain the specified attributes.",
 *
 * @param data          Javascript data or a JSON string to be parsed, and filtered.
 * @param domain        A chcs domain: demographics, diagnoses, prescriptions, labs, procedures
 * @param prefix        An optional prefix to apply for some domains
 */
function filter(data, domain, prefix) { 

    if (_.isEmpty(data)) {
        throw Error("Domain filter component requires data to process!");
    }

    if (_.isEmpty(domain) || ! domain in _.keys(FILTER_TEMPLATES)) {
        throw Error("Domain filter component received invalid domain: "+domain);
    }
  
    // Lookup the filters for the requested domain
    var domainFilters = FILTER_TEMPLATES[domain];
    if (_.isEmpty(domainFilters)) {
        throw Error('Domain filter component received unknown domain: ' + domain + '!'); 
    }

    // Substitute in whatever prefix was specified if there is one
    var prefixedFilters = _.map(domainFilters, function(domainFilter) {
        if (domainFilter.value.startsWith('<prefix>') && _.isUndefined(prefix)) {
            throw Error("Domain filter component domain " + domain + " requires a prefix but none was specified!");
        }
        return { jsonpointer: domainFilter.jsonpointer, 
                 value: domainFilter.value.replace("<prefix>",prefix) }; 
    });

    // If we have JSON-LD, start the jsonpointer paths at the graph, skipping the context
    var start = _.isUndefined(data['@graph']) ? undefined : '/@graph';

    return filterLib.filterByJsonPointers(data, prefixedFilters, start);
}

