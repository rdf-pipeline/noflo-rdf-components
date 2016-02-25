// vnis.js

var _ = require('underscore');

var inputStateModule = require('./input-states');

var IIP_VNID = '';

/**
 * Lookup the a vni by vnid.  If no vnid is provided the IIP VNID will be used.
 * If the Vni does not exist, a new one will be created.
 *
 * @this the component node instance
 * @param vnid (optional) vnid to look up; defaults to IIP_VNID
 * @param parentVni (optional) used to create a new Vni with the specified parent VNI if no VNI exists
 *
 * @return the vni associated with the vnid
 */
module.exports = {

    deleteAll: function() { 
       this.vnis = [];
    },

    delete: function( vnid ) {
        if ( vnid in this.vnis ) {
            delete this.vnis[vnid];
        } 
        return this;
    },

    get: function( vnid, parentVni ) { 
        vnid = vnid || IIP_VNID;
        this.vnis = this.vnis || [];

        if ( _.isUndefined( this.vnis[vnid] )  ) {
            // have no vni so create one
console.log('create vni for '+this.name+' vnid: ',vnid);
            this.vnis[vnid] = { 
                vnid: vnid,
                inputStates: inputStateModule, 
                node: this
            };  

            if ( ! _.isEmpty( parentVni ) ) { 
                this.vnis[vnid].parentVni = parentVni; 
            }

            // TODO: Add previousLms here
        }

        return this.vnis[vnid]; 
    }
};
