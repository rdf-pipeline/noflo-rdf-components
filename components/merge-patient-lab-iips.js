/**
 * File:  merge-patient-lab-iips.js
 *
 * Given a json string or a js object of patient data and json string of patient lab work, this
 * simple test component merges the two into a single javascript object and returns it 
 */

var _ = require('underscore');
var logger = require('../src/logger');

var jswrapper = require('../src/javascript-wrapper');

/**
 * Simply merges a patient and lab record into one.
 *
 * @param patient a JSON patient record to be processed
 * @param labwork a JSON lab record to be processed
 * @this vni context
 *
 * @return the combined patient/lab record
 */
module.exports = jswrapper( updater );

/**
 * Merges a patient and a labwork record into a single combined record.
 * If no patient or labwork parameter is specified, the original parameter
 * will be returned.
 * 
 * @this like all RDF pipeline updaters, this will usually be called on the 
 *       vni context, however, this updater does not depend on that context. 
 *
 * @param patient a patient record in either json or string format
 * @param labwork a lab record in either json or string format
 * 
 * @return the merged record
 */
function updater(patient, labwork) {

    var aPatient = jsObject( patient );
    var aLabwork = jsObject( labwork );
    return _.extend({}, aPatient, aLabwork);
}

/**
 * Converts whatever input parameter of any type (or even undefined) 
 * into a javascript object 
 * 
 * @param parameter input parameter to be converted.  This could be
 *        a string, already a javascript object, or even undefined.
 *
 * @return a javascript object 
 */
function jsObject( parameter ) { 

    if ( _.isUndefined( parameter ) ) {  
        return {}; 
    } 

    try { 
        return  _.isString(parameter) ? JSON.parse(parameter) : parameter;
    } catch ( e ) { 
       var msg = "Unable to parse parameter "+parameter+": "+e;
       logger.error( msg );
       throw Error( msg );
    }
} 
