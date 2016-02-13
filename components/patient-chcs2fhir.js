/**
 * File:  patient-chcs2fhir.js
 */

var _ = require('underscore');
var jsonpointer = require('jsonpointer');

var jswrapper = require('../src/javascript-wrapper');

exports.getComponent = jswrapper({

    description: "translates a CHCS patient record to fhir.",

    inPorts: { 
        patient: { 
            datatype: 'object',
            description: "a JSON object with CHCS patient data to be converted o FHIR",
            required: true
        }
    },

    updater: function( patient ) {   

        var prefix = '';

        var warnings = [];
        var result = {
            "resourceType" : "Patient",
        };
        var participatingProperties = [];

        result.identifier = fhirIdentifier( jsonpointer.get(patient, '/ssn-2'),
                                             jsonpointer.get(patient, '/dod_id_-2'), 
                                             prefix,
                                             participatingProperties );
    
        var humanName = jsonpointer.get(patient, '/name-2');
        if ( humanName ) { 
            result.name = fhirHumanName ( humanName,
                                           'name-2',
                                           prefix,
                                           participatingProperties );
        } else { 
            result.name = fhirHumanName ( jsonpointer.get(patient, '/label'),
                                           'label',
                                           prefix,
                                           participatingProperties );
        }
    
        // fhir gender
        var gender = jsonpointer.get(patient, '/sex-2/label');
        if ( gender ) {
           result.gender = gender.toLowerCase();
           participatingProperties.push(prefix + 'sex-2')
        }

        // fhir birthDate
        var dob = jsonpointer.get(patient, '/dob-2/value');
        if ( dob )  { 
            result.birthDate = fhirDate( dob );
            participatingProperties.push(prefix + 'dob-2');
        }

        var address = fhirAddress(patient, prefix, participatingProperties);
        if ( ! _.isEmpty( address ) ) {
            result.address = address;
        }

        var maritalStatus = jsonpointer.get(patient, '/marital_status-2');
        if ( maritalStatus )  { 
            result.maritalStatus = fhirMaritalStatus( maritalStatus );
            participatingProperties.push(prefix + 'marital_status-2');
        }

        var result = { 'fhir': result,  // the actual translation
                       'participants': participatingProperties, // the chcs attributes that composed this translation
                       'warnings': warnings,
        };

        return result;
    }  
});


// http://hl7-fhir.github.io/datatypes.html#Address
//{
//    "line" : ["<string>"], // Street name, number, direction & P.O. Box etc.
//    "city" : "<string>", // Name of city, town etc.
//    "district" : "<string>", // District name (aka county)
//    "state" : "<string>", // Sub-unit of country (abbreviations ok)
//    "postalCode" : "<string>", // Postal code for area
//    "country" : "<string>", // Country (can be ISO 3166 3 letter code)
//    "period" : { Period } // Time period when address was/is in use
//}

function fhirAddress( patient,
                      prefix,
                      participatingProperties ) {

    var result = {
        "type" : "postal", // postal | physical | both
    };

    var line = [];

    var streetAddress1 = jsonpointer.get(patient, '/street_address-2');
    if ( streetAddress1 ) {
        line.push( streetAddress1 );
        participatingProperties.push(prefix + 'street-address-2');
    }

    var streetAddress2 = jsonpointer.get(patient, '/street_address_2-2');
    if ( streetAddress2 ) {
        line.push( streetAddress2 );
        participatingProperties.push(prefix + 'street_address_2-2');
    }

    var streetAddress3 = jsonpointer.get(patient, '/street_address_3-2');
    if ( streetAddress3 ) {
        line.push( streetAddress3 );
        participatingProperties.push(prefix + 'street_address_3-2');
    }

    if (line.length > 0) result.line = line;

    var city = jsonpointer.get(patient, '/city-2');
    if ( city ) {
        result.city = city;
        participatingProperties.push(prefix + 'city-2');
    }

    var state = jsonpointer.get(patient, '/state-2');
    if ( state ) {
        var state_country = state.split('/');  // ME/USA
        result.state = state_country[0];
        if (state_country.length > 1) result.country = state_country[1];
        participatingProperties.push(prefix + 'state-2');
    }

    var county = jsonpointer.get(patient, '/county-2');
    if ( county ) {
        result.district = county;
        participatingProperties.push(prefix + 'county-2');
    }

    var zipcode = jsonpointer.get(patient, '/zip_code-2');
    if ( zipcode ) {
        result.postalCode = zipcode;
        participatingProperties.push(prefix + 'zip_code-2');
    }

    return result;
}

/**
 * Translate chcs_date string in format yy(yy)?-mm-dd to fhir format mm-dd-yyyy.
 * @param {string} chcsDate - yy(yy)?-mm-dd
 * @returns {string} - mm-dd-yyyy
 */
function fhirDate(chcsDate ) { 

    var m = chcsDate.match(/(\d{2,4})-(\d{2})-(\d{2})/);
    if (m) {
        var year = m[1]; // year group in re
        if (year.length == 2) year = '19' + year; // fix up yy
        var month = m[2]; // month group in re
        var day = m[3]; // day group in re
        return day + '-' + month + '-' + year;
    } 

    throw new Error("Bad chcs date: '" + chcsDate + "'");
}

/**
 * Translate a chcs name format 'LAST, FIRST MI TITLE' to fhir HumanName
 * http://hl7-fhir.github.io/datatypes.html#HumanName
 *
 * @param chcsName
 * @returns fhir name 
 *
 * TODO: has to be a better way to write these things. Don't know how...
 */
function fhirHumanName( chcsName,
                        label,
                        prefix,
                        participatingProperties ) {

    var n = chcsPersonName(chcsName);

    var result = {};

    result.family = [ n.last ]; // yes, all lists
    var given = n.first;
    if (_.findKey(n, 'mi')) // middle initial mi
        given += ' ' + n.mi;
    result.given = [ given ];

    if (_.findKey(n, 'title')) { // title
        result.prefix = [n.title ]; // TODO: list?
    }

    participatingProperties.push(prefix + label);
    return result;
}

/**
 * Turn a US social security number into a fhir identifier.
 * @param chcsSsn
 * @param chcsDodId
 * @returns {{use: string, type: null, system: string, assigner: string, type: null, value: *}}
 *
 * TODO: would be helpful to capture the json path from the source chcs object
 *   and put it in the result, something like 'x-source-path': "/@graph/* /type='chcss:2'/ssn-2"
 */
function fhirIdentifier( chcsSsn, 
                         chcsDodId,
                         prefix,
                         participatingProperties ) {

    var result = [];

    // ssn if it has a value
    if (chcsSsn) {
        result.push({
            'use': 'usual',
            // 'system': "ssn://www.us.gov/",  // made up
            'assigner': 'US',
            'type': {'coding': 'chcss', 'text': chcsSsn },
            'value': chcsSsn
        });
        participatingProperties.push(prefix+'ssn-2'); 
    };

    // dod_id if it has a value
    if (chcsDodId) {
        result.push({
            'use': 'usual',
            // 'system': "dod://www.us.mil/",  // made up
            'assigner': 'US',
            'type': {'coding': 'chcss', 'text': chcsDodId },
            'value': chcsDodId
        });
        participatingProperties.push(prefix + 'dod_id-2'); 
    };

    return result;
}


/**
 * Translate a chcs marital status into a fhir maritalStatus(http://hl7-fhir.github.io/valueset-marital-status.html)
 * @param {string} chcsMaritalStatus - acts as an enum
 * @returns {}
 */
function fhirMaritalStatus(chcsMaritalStatus) {

    var ucChcsMaritalStatus = chcsMaritalStatus.label.toUpperCase();

    var code;
    if (ucChcsMaritalStatus === 'SINGLE, NEVER MARRIED') {
        code = 'S';
    } else if (ucChcsMaritalStatus === 'MARRIED') {
        code = 'M';
    } else if (ucChcsMaritalStatus === 'DIVORCED') {
        code = 'D';
    } else if (ucChcsMaritalStatus === 'WIDOWED') {
        code = 'W';
    } else {
        throw new Error("Bad marital status: '{ms}'".format(ms=chcsMaritalStatus));
    }

    // return a "CodableConcept"
    return {'coding': code, 'text': [ chcsMaritalStatus ] };
}

/**
 * Translate a chcs name format 'LAST, FIRST MI TITLE' to fhir HumanName
 * http://hl7-fhir.github.io/datatypes.html#HumanName
 *
 * @param chcsName
 * @returns {{resourceType: string, use: string}}
 *
 * TODO: has to be a better way to write these things. Don't know how...
 */
function chcsPersonName(chcsName) {

    var parts = chcsName.split(/\s*,\s*/); // last, first mi title; split off the last name

    // Name should have had a comma in it, so there should be two parts and the second part should have contents.
    if (parts.length == 1 || parts[1].length == 0) {
        throw new Error("Bad chcs name, expecting 'LAST, FIRST MI? TITLE?': '" + chcsName + "'");g    }


    var afterComma = parts[1].split(/\s+/); // the second part should ahve first mi? title?

    var result = {
        'last': parts[0],
        'first': afterComma[0],

    };

    if (afterComma.length > 1) {// middle initial mi
        result.mi = afterComma[1];
    }

    if (afterComma.length > 2) { // title
        result.title = afterComma[2];
    }

    return result;
}
