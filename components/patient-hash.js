// patient-hash.js

var _ = require('underscore');
var util = require('util');

var extractor = require('translators').cmumps;

var createLm = require('../src/create-lm');
var stateFactory = require('../src/create-state');
var logger = require('../src/logger');
var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper({description: "Given CMUMPS JSON patient data, builds a hash object of each "+
                                       "demographic, medication, procedure, and diagnosis, using the "+
                                       "resource ID as the key for each.",
                          icon: 'share-alt-square',
                          updater: patientHash});

/**
 * Given a collection of CMUMPS patient JSON, maps the demographics, medications, diagnoses, & procedures
 * into a hash by resource ID for each.  This component is useful in setting up the patient
 * resources for use by translation wrapper components that will perform the actual translation.
 *
 * @this VNI context
 *
 * @patient_json a collection of patient resources in JSON format.
 * @translator_components a hash with the translator components to be used with the patient
 *                        resource hash down stream. 
 * @metadata_key name of the metadata key that will link the hash generated to its individual completed 
 *               elements later
 *
 * @return the patient resource hash
 */
function patientHash(patient_json, translator_components, metadata_key) {
    logger.debug('Enter', {nodeInstance: this.nodeInstance});

    if (_.isEmpty(patient_json)) throw Error('Patient hash component found no patient json!');

    if (_.isEmpty(metadata_key) || !_.isString(metadata_key)) {
       logger.warn('Patient hash component found no meta key string; using default key "patientId"');
       metadata_key = 'patientId';
    }

    var translators = _.isString(translator_components) ? JSON.parse(translator_components) : translator_components;

    // Ensure that we have translators for demographics, prescriptions, and procedures 
    //  - either those specified or the default ones
    translators = translators || {demographics: 'rdf-components/translate-demographics-cmumps2fhir',
                                  diagnosis: 'rdf-components/translate-diagnosis-cmumps2fhir',
                                  prescription: 'rdf-components/translate-prescription-cmumps2fhir',
                                  procedure: 'rdf-components/translate-procedure-cmumps2fhir'};

    if (_.difference(Object.keys(translators), ['demographics', 'diagnosis', 
                                                'prescription', 'procedure']).length > 0 ) {
        throw Error("Unknown translation. Supported translators are: 'demographics', 'diagnosis', 'prescriptions', 'procedures'.");
    }

    var patient = _.isString(patient_json) ? JSON.parse(patient_json) : patient_json;

    var hash = {};
    var addToHash = function(resources, translator, patientId) {
        if (!_.isEmpty(resources)) { 
            var resourceIds = [];
            var addResource = function(resource) { 

                var id = resource.type + ':' + patientId + ':' + resource._id;

                if (_.find(resourceIds, function(resourceId) { return id == resourceId })) {
                    logger.warn('found multiple resources for ',id);
                    return;
                } 
                resourceIds.push(id);
                hash[id] = {data: resource, translateBy: translator};
            };

            if ( _.isArray(resources)) { 
               resources.forEach(function(resource) { 
                    addResource(resource);
               });
            } else {
                addResource(resources);
            }
        }
    }

    var patientDemographics = extractor.extractDemographics(patient); 
    var outState = this.outputState();
    if (_.isEmpty(patientDemographics) && _.isUndefined(outState[metadata_key])) {
        logger.debug('No demographics; outstate = ',outState);
        throw Error("No patient demographics found!");
    }

    var patientId;
    if (!_.isUndefined(outState[metadata_key])) {
       patientId = outState[metadata_key];
    } else {
        patientId = _.isArray(patientDemographics) ? patientDemographics[0]._id : patientDemographics._id;
    }

    var self = this;
    _.each(translators, function(translator, type) { 
          switch(type) { 
              case 'demographics': {
                  addToHash(patientDemographics, translator, patientId);
                  break;
              }
              case 'diagnosis': {
                  addToHash(extractor.extractDiagnoses(patient), translator, patientId);
                  break;
              }
              case 'prescription': {
                  addToHash(extractor.extractMedications(patient), translator, patientId);
                  break;
              }
              case 'procedure': {
                  addToHash(extractor.extractProcedures(patient), translator, patientId);
                  break;
              }
         }
    });

    if (_.isUndefined(outState[metadata_key])) { 
        // No metadata identifying the patient yet - put it on now. 
        stateFactory.addMetadata(outState, {[metadata_key]: patientId});
    }

    logger.debug({nodeInstance: this.nodeInstance} + ' sending hash with keys:\n',Object.keys(hash));
    return hash;
}

