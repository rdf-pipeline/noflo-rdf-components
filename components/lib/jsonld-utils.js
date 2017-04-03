/**
 * jsonld-utils.js
 *
 * A library of JSON-LD helper APIs for use in the noflo RDF pipeline component updaters.
 */

var _ = require('underscore');

var request = require('request');
var url = require('url');
var jsonld = require('jsonld').promises;

var logger = require('../../src/logger');

module.exports = {
    getContext: getContext,
    jsonldToNormalizedRdf: jsonldToNormalizedRdf 
};

/** 
 * Checks the JSON-LD context to see if it is a URL, or a fully described context.
 * If it is a URL to another context, performs a get to retrieve the remote context.  
 *
 * If the context cannot be retrieved and a default context is provided, 
 * the default context will be used - useful for local testing when off 
 * the network or VPN.  A warning will be printed if this is done.
 * 
 * @param data           (required) JSON-LD data 
 * @param defaultContext (optional) the default context to be used
 * 
 * @return the resolved fully defined context or a reject error
 */
function getContext(data, defaultContext) {

    if (_.isEmpty(data)) return Promise.reject("getContext called with no data!");

    // Verify we have something that looks like JSON-LD - it should have @context and @graph.  
    if (_.isEmpty(data["@context"]) && _.isUndefined(defaultContext)) return Promise.reject("getContext called with no context!");
    if (_.isEmpty(data["@graph"])) return Promise.reject("getContext called with no data graph!");

    return new Promise(function(resolve, reject) {
        var context = data["@context"];

        if (_.isString(context) && context.startsWith('http')) {
            logger.debug('Following context URI: ',context);
            request.get(context, function(error, response, body) {
                if (error) {
                    if (!_.isUndefined(defaultContext)) { 
                        logger.warn('Unable to get context for '+context+': '+error + '; default context will be used');
                        body = defaultContext;
                    } else  
                        reject('Unable to get context for '+context+': '+error);
                }

                try {
                    var newContext = _.isString(body) ? JSON.parse(body) : body; 
                    resolve(newContext); 
                } catch (e) {
                    // Could not parse whatever context we got - URL or default - reject it. 
                    reject("GetContext API is unable to parse context: "+e.message);
                }
            });

        } else {
            resolve(context);
        }
    });
}

/**
 * Normalize JSON-LD using the RDF Dataset Normalization Algorithm 
 * (URDNA2015), see: http://json-ld.github.io/normalization/spec/ 
 * 
 * @param json (required) JSON-LD data to be normalized
 * 
 * @return the resolved normalized RDF or a reject error
 */
function jsonldToNormalizedRdf(json) { 

    if (_.isEmpty(json)) return Promise.reject("jsonldToNormalizedRdf called with no JSON data!");

    return new Promise(function(resolve, reject) {
        jsonld.normalize(json, 
                         { algorithm: 'URDNA2015', format: 'application/nquads' }, 
                         function(error, normalizedRdf) {

                             if (error) {
                                 reject('Unable to convert JSON-LD to normalized RDF! '+error);
                             }
               
                             // normalized is a string that is a canonical representation of the document 
                             // that can be used for hashing, comparison, etc. 
                             resolve(normalizedRdf);
                         }
        );
    });
}
