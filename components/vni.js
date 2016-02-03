// Vni.js

var _ = require('underscore');
var Lm = require('./Lm');
var state = require('./state');

// Hash of vnis
vnis = []; 

// Define Vni class and its subclasses - InterNodeVni & IipVni
function Vni( vnid ) {
  this.vnid = vnid;
  this.lm = Lm();
  this.allInputStates = state.allInputStates;
  this.allOutputStates = state.allOutputStates;
  this.inputState = state.inputState;
  this.outputState = state.outputState;
  this.node = this.nodeInstance;
}

function NodePortVni( vnid ) {
  Vni.call(this, vnid);
  this.previousLms = [];
}

var IIP_VNID = '*';
function IipVni() {
  Vni.call(this, IIP_VNID);
}

module.exports = {

    // Create a new vni and return it.
    // If no vnid is provided (or has 0 length), an IIP constant vni will be created.
    createVni: function( vnid, parentVni ) {

        // Does vni already exist?
        if ( _.isUndefined( vnis[vnid] ) ) {

           var vni; 
           if ( _.isUndefined( vnid ) || vnid.length < 1 ) { 
              vni = vnis[IIP_VNID] = new IipVni();
           } else { 
              vni = vnis[vnid] = new NodePortVni( vnid ); 
           }
        }

        return vni;
    },
 
    // Returns the vni associated with the specified vnid.
    // If no vnid is specified (undefined or '') the special IIP_VNID will be returned.
    vni: function( vnid ) { 

        var myVnid = (_.isUndefined(vnid) || vnid.length < 1) ? IIP_VNID : vnid;

        if ( _.isUndefined( vnis[myVnid] ) || _.isEmpty( vnis[myVnid] ) ) {
             return this.createVni( myVnid );
        }

        return vnis[myVnid]
    }
};
