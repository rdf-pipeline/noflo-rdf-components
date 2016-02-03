// rpf.js

var _ = require('underscore');
var vni = require('./vni');

module.exports = {
   
     createVni: function( vnid, parentVni ) { 
         return vni.createVni( vnid, parentVni);
     },

     vni: function( vnid ) { 
         return vni.vni( vnid );
     }
};
