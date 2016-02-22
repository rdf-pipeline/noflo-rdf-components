// vnis.js

var _ = require('underscore');

var inputStateModule = require('./input-states');

var IIP_VNID = '';
var vnis = [];

/**
 * Lookup the a vni by vnid.  If no vnid is provided the IIP VNID will be used.
 * If the Vni does not exist, a new one will be created.
 *
 * @this the component node instance
 * @param vnid (optional) vnid to look up; defaults to IIP_VNID
 * @param portInfo (optional) and object with  port name, source port node name, source port name.  If this
 *                 parameter is specified, port name is required.  The other two are optional.
 * @param parentVni (optional) used to create a new Vni with the specified parent VNI if no VNI exists
 *
 * @return the vni associated with the vnid
 */
module.exports = {

    deleteAll: function() { 
       vnis = [];
    },

    delete: function( vnid ) {
        if ( vnid in vnis ) {
            delete vnis[vnid];
        } 
        return this;
    },

    get: function( vnid, portInfo, parentVni ) { 

        vnid = vnid || IIP_VNID;

        if ( _.isUndefined( vnis[vnid] )  ) {
            // have no vni so create one
            vnis[vnid] = { 
                vnid: vnid,
                inputStates: inputStateModule,
                node: this
            };  

            if ( ! _.isEmpty( parentVni ) ) { 
                vnis[vnid].parentVni = parentVni; 
            }

            // TODO: Add previousLms here
        }

        return vnis[vnid]; 
    }
};
