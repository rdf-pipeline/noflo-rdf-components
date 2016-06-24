// patient-hash.js

var _ = require('underscore');

var extractor = require('translators').cmumps;

var createLm = require('../src/create-lm');
var logger = require('../src/logger');
var wrapper = require('../src/javascript-wrapper');

module.exports = wrapper(patientHash);

/**
 * Given a collection patient resoruces, extract the demographics, medications, & procedures,
 * mapping them into a hash by resource ID.  This component is useful in setting up the patient
 * resources for use by translation wrapper components that will perform the actual translation.
 *
 * @this VNI context
 * @patient_json a collection of patient resources in JSON format.
 * @translator_components a hash with the translator components to be used with the patient
 *                        resource hash down stream. 
 *
 * @return the patient resource hash
 */
function patientHash(patient_json, translator_components) {

    logger.debug('Enter', {nodeInstance: this.nodeInstance});
    if (_.isEmpty(patient_json)) { 
        throw Error('Patient hash component found no patient json!');
    }

    var translators = _.isString(translator_components) ? JSON.parse(translator_components) : translator_components;

    // Ensure that we have translators for demographics, prescriptions, and procedures 
    //  - either those specified or the default ones
    translators = _.defaults(translators || {},  
                             {demographics: 'rdf-components/translate-demographics-cmumps2fhir',
                              labs: 'rdf-components/shex-cmumps-to-rdf',
                              prescription: 'rdf-components/translate-prescription-cmumps2fhir',
                              procedure: 'rdf-components/translate-procedure-cmumps2fhir'});

    var patient = _.isString(patient_json) ? JSON.parse(patient_json) : patient_json;

    var hash = {};
    var addToHash = function(resources, translator) {
        if (!_.isEmpty(resources)) { 
           var resourceIds = [];
           resources.forEach(function(resource) { 
               var id = resource.type + ':' + resource._id;
               if (_.find(resourceIds, function(resourceId) { return id == resourceId })) {
                   logger.warn('found multiple resources for ',id);
                   return;
               } 

               resourceIds.push(id);
               hash[id] = {data: resource, translateBy: translator};
           });
        }
    }

    var patientDemographics = extractor.extractDemographics(patient); 
    _.each(translators, function(translator, type) { 
          switch(type) { 
              case 'demographics': {
                  addToHash(patientDemographics, translator);
                  break;
              }
              case 'labs': {
                  // Current shex translator expects entire patient record
                  var id = _.isEmpty(patientDemographics) ? 'PatientRecord:'+createLm(): 'PatientRecord:'+patientDemographics[0]._id;
                  hash[id] = {data: patient, translateBy: translator};
                  break;
              }
              case 'prescription': {
                  addToHash(extractor.extractMedications(patient), translator);
                  break;
              }
              case 'procedure': {
                  addToHash(extractor.extractProcedures(patient), translator);
                  break;
              }
              default:
                  throw Error("Unknown translation. Supported translators are: 'demographics', 'prescriptions', 'procedures'.");
          }
    });

    logger.debug({nodeInstance: this.nodeInstance} + ' sending hash with keys:\n',Object.keys(hash));
    return hash;
}

