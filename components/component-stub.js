/**
 * File: component-stub.js 
 */

var _ = require('underscore');
var noflo = require('noflo');
var rpf = require('./rpf');

module.exports = function(nodeDef) { 

    var component =  new noflo.Component( nodeDef );
    component.rpf = rpf;
    return component; 
} 
