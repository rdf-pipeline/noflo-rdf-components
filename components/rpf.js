// rpf.js

var _ = require('underscore');
var vni = require('./vni');

module.exports = {
   
     vni: function( vnid ) { 
         return vni( vnid );
     }
};
