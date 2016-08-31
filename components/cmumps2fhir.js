// cmumps2fhir.js
// Helper for the cmumps2fhir-* and translate-* components since the logic is similar for all of them.

var _ = require('underscore');
var fs = require('fs');
var util = require('util');

var extractor = require('translators').cmumps;

var logger = require('../src/logger');

/** 
 * Given some cmumps patient data, this helper extracts the piece of interest (e.g, demographics),  
 * translates it to FHIR, and returns it.
 * 
 * @param data cmumps patient data to be translated
 * @param extractor the function for extracting the cmumps data of interest
 * @param translator the function for cmumps to fhir translation
 * @param cmumpsFile  output path for writing json intermediate file for cmumps data
 * @param fhirFile output path for writing json intermediate file for fhir data
 * 
 * @return the patient's data in FHIR format
 */
module.exports = function(data, extractor, translator, cmumpsFile, fhirFile) { 

    if (_.isUndefined(data)) { 
        throw Error("Cmumps2fhir requires data to translate!");
    }

    // Parse string json input (from IIP) if that's what we got 
    var patientData = _.isString(data) ? JSON.parse(data) : data;

    // Extract all patient demographic data from dataset
    var cmumpsData = _.isUndefined(extractor) ? patientData: extractor(patientData);

    // Write intermediate cmumps json file for debug purposes
    writeFile(cmumpsFile, cmumpsData);

    if (_.isEmpty(cmumpsData)) {
        // This may be normal in some cases, so log a warning in case it's not, and return 
        if (!_.isUndefined(extractor)) logger.warn("No patient cmumps data found!");
        return;
    }

    var fhirData;
    if (_.isArray(cmumpsData)) { 
        fhirData = _.map(cmumpsData, function(cmumpsDatum) {
            return _.isUndefined(translator) ? cmumpsDatum : translator(cmumpsDatum);
        })
    } else {
        fhirData = _.isUndefined(translator) ? cmumpsData : translator(cmumpsData);
    }

    if (_.isEmpty(fhirData)) {
        // This may be normal in some cases, so just log a warning we got nothing, and return 
        if (!_.isUndefined(translator)) 
            logger.warn("No patient cmumps data translated to fhir! Input data was:", data);
    } else { 
        // Set the graph URI in the VNI for use by downstream components
        this.outputState({graphUri: graphUri.call(this, fhirData)});

        // Write intermediate fhir json file for debug purposes
        writeFile(fhirFile, fhirData);
    }

    return fhirData;
}

/**
 * Create a graph ID for a translator, to be stored as metadata for use by
 * downstream nodes
 *
 * @this vni context
 * @param translation a translation that should contain both an id and a resource type.
 * @return the graph ID if it is the first one we've seen; an array of graph IDs if we already
 *         had one; will return undefined if there is no id
 */
function graphUri(translation) {
     var id, type, translated;
     var state = this.outputState();

     if (_.isArray(translation) && translation.length > 0) {

          // Not supporting graph URI metadata on arrays of translations at this time
         if (translation.length != 1) return;   
         translated = translation[0]; 

      } else {
         translated = translation;
      }

      id = translated.id || translated._id;
      type = translated.resourceType || translated.type;

    if (!(_.isUndefined(id) || _.isUndefined(type)))  {

        var translator = this.nodeInstance.componentName || 'unknown-translator';
        var resourceId = encodeURI(type + ":" + id);

        var uri;

        // TODO: Replace the hard coded patientID with a metadata key
        if (_.isUndefined(state.patientId)) {
            uri = 'urn:local:fhir::' + encodeURIComponent(translator) + ':' + resourceId;
        } else {
            uri = 'urn:local:fhir:' + encodeURIComponent(state.patientId) + ':' + encodeURIComponent(translator) + ':' + resourceId;
        }

        return uri;
    } else { 
        logger.debug("Unable to build a graph URI because translation resource id or type is missing! Input was: ",translation);
    }
}

function writeFile(fileName, data) {
    if (! _.isEmpty(fileName)) {
        fs.writeFileSync(fileName, util.inspect(data, {depth: null}));
        logger.info("Wrote ", fileName);
    }
}
