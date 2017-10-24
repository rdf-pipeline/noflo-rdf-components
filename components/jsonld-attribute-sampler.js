// jsonld-attribute-sampler.js

var _ = require('underscore');

var fs = require('fs');

var jsonpointer = require('json-pointer');
var util = require('util');

var translators = require('translators').chcs;

var format = require('../src/format.js');
var logger = require('../src/logger');
var profiler = require('../src/profiler.js');
var wrapper = require('../src/javascript-wrapper');

/**
 * Each time it processes patient jsonld data, this component will compare the json  
 * attributes (using json pointers) to see if it has seen this attribute before.  If it
 * has not, it will add new json pointers to its list, log the addition to the logfile,
 * and write out the patient data to a file for future reference.
 */
module.exports = wrapper({description: "Builds a list of jsonld attributes and writes any objects with previously unseen attributes to a sample file.",
                          icon: 'language',
                          isTransient: true,
                          updater: jsonldSampler});

/**
 * Compiles a list of every jsonpointer seen across every dataset seen by this instance.
 * The jsonpointers are written to file target_dir/jsonpointers-<type>.json.
 * A sample file is written for the dataset associated with each new jsonpointer found
 * under the path target_dir/<datatype>:<metadata id>.txt
 *
 * @param data jsonld data to be analyzed
 * @param target_dir directory where jsonpointers file and sample files should be written
 * @param metadata_key name of the metadata with an ID (e.g., patient ID) for this dataset
 * @param type data type to be analyzed: demographics, diagnostics, prescriptions, procedures; 
 *        if not specified, it defaults to analyzing all data passed in
 * 
 * @return the original data so it can be used downstream
 */
function jsonldSampler(data, target_dir, metadata_key, type) {   

    var name = this.nodeInstance.nodeName || this.nodeInstance.componentName || "jsonld-attribute-sampler";

    if (_.isUndefined(data) || _.isUndefined(data['@graph'])) { 
        throw Error(name + " requires jsonld data to analyze!");
    }

    var metadataKey = _.isUndefined(metadata_key) ? 'id' : metadata_key;
    var inputState = this.inputStates('data');
    if (_.isUndefined(inputState) || _.isUndefined(inputState[metadataKey])) { 
        // throw an error - we do not know who this record is for -> cannot proceed.
        throw Error(name + " no identifier found for metadata key: "+metadataKey);
    }

    var nodeInstance = this.nodeInstance;

    // Parse string json input (from IIP) if that's what we got
    var patientData = _.isString(data) ? JSON.parse(data) : data;

    var extractor = getExtractor(type);
    var extractedData = _.isUndefined(extractor) ? patientData : extractor(patientData);
    var dataType = _.isUndefined(type) ? 'all' : type;

    var patientId = this.inputStates().data.patientId;

    var dirName = _.isUndefined(target_dir) ? './data/' : target_dir;
    if (!fs.existsSync(dirName)){
       fs.mkdirSync(dirName);
    }

    var logfile = dirName + 'jsonld-attribute-sampler.log';
    var jsonpointerFile = dirName + 'jsonpointers-' + dataType + '.json';
    return jsonpointers(nodeInstance, jsonpointerFile).then(function(jsonptrs) {

        if (_.isUndefined(nodeInstance.jsonpointers)) { 
            fs.appendFileSync(logfile, '\nInitialized processing with ' + _.keys(jsonptrs).length + ' jsonpointers\n'); 
        }

        nodeInstance.jsonpointers = jsonptrs; 

        var added = [];
        _.each( extractedData, function(datum) {
            added = 
                updateJsonpointers(patientId, 
                                   logfile,
                                   nodeInstance.jsonpointers, 
                                   datum, 
                                   added);
        });

        logger.info('Added jsonpointers: ',added);

        if (added.length > 0) {

            fs.writeFileSync(jsonpointerFile, 
                             JSON.stringify(jsonpointer.dict(nodeInstance.jsonpointers), null, '\t'));

            var sampleFile = dirName + dataType + ':' + patientId + '.txt';
            fs.writeFileSync(sampleFile, JSON.stringify(extractedData));

            fs.appendFileSync(logfile, '\n'); 
        }
 
        var pipelineMetrics = profiler.pipelineMetrics;
        logger.info('\n*******************************************************************************' +
                    '\njsonld-attribute-sampler found '+ _.keys(nodeInstance.jsonpointers).length+
                    ' jsonpointers after processing id '+patientId +
                    '\n\nTotal VNIs: ' + pipelineMetrics.totalVnis +
                    '\nDefault VNIs: ' + pipelineMetrics.totalDefaultVnis +
                    '\n*******************************************************************************\n');
        return data;
    });
}

function getExtractor(type) { 
    if (_.isUndefined(type)) { 
        return;
    }

    switch(type) {
        case 'demographics': 
            return translators.extractDemographics;
        case 'diagnoses': 
            return translators.extractDiagnoses;
        case 'prescriptions': 
            return translators.extractMedications;
        case 'procedures': 
            return translators.extractProcedures;
        default: 
            throw Error("Jsonld attribute sample found unexpected type: "+type+"!\n" +
                        "Supported types: demographics, diagnoses, prescriptions, procedures.");
    }
}

function jsonpointers(nodeInstance, filepath) { 

    // Don't have any json pointers and do have a file, so read and parse it
    return new Promise(function(resolve, reject) {

        // Already have the current list of json pointers?  If so return it
        if (! _.isUndefined(nodeInstance.jsonpointers)) {
            resolve(nodeInstance.jsonpointers);

        } else if (_.isUndefined(filepath)) {
            // No file path? Start with empty json pointers - probably bootstrapping
            logger.warn('No jsonpointers file '+filepath+' found. Defaulting to {}');
            resolve({});

        } else {
        
            fs.readFile( filepath, function( err, data ) {

                if(err) {
                   logger.warn("Unable to read file " + filepath + ":",err);
                   resolve({}); 

                } else if (_.isUndefined(data) || _.isEmpty(data)) {
                   logger.warn("File " + filepath + " had no contents.");
                   resolve({}); 
                } else {

                    var jsonPtrs = {}; 
                    _.mapObject(JSON.parse(data), function(value, key) { 
                        jsonpointer.set(jsonPtrs, key, value);
                    }); 

                    resolve(jsonPtrs);
                }
           });
        }
    });
}

function updateJsonpointers(patientId, logfile, jsonpointers,  data, added, jsonpointerPath) {

     var jsonpointerPath = jsonpointerPath || '/';
 
     _.mapObject(data, function(value, key) { 
         if (_.isObject(value)) {
             updateJsonpointers(patientId, logfile, jsonpointers, value, added, jsonpointerPath + key + '/');

         } else {
             var path = jsonpointerPath + key;

             // Flatten any arrays since we only care about attributes
             path = (path.match(/\/[0-9]+\//g)) ? path.replace(/\/[0-9]+\//g, '/') : path;
             

             if (! jsonpointer.has(jsonpointers, path)) { 

                 // Do we have a parent node already setting this to a constant? 
                 // If so, we need to clear it.
                 var parent = path.substring(0, path.lastIndexOf('/'));
		 if ((!_.isEmpty(parent)) && jsonpointer.has(jsonpointers, parent)) { 
                     var parentValue = jsonpointer.get(jsonpointers, parent);
                     if (! _.isObject(parentValue)) { 
                         jsonpointer.remove(jsonpointers, parent);
                     }
                 }

                 var msg = 'Patient ' + patientId + ' added jsonpointer ' + path;
                 logger.info(msg);
                 fs.appendFileSync(logfile, msg+'\n');
                 jsonpointer.set(jsonpointers, path, value);
                 added.push(path);
             } 
         } 
     });
              
     return added;
}
