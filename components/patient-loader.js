/**
 * File:  patient-loader.js
 */
var _ = require('underscore');

var noflo = require('noflo');
var basenode = require('../src/base-node');

exports.getComponent = function() {
   return _.extend(
      new noflo.Component( 
          _.extend( {},
                    { inPorts: {
                        file: {
                            description: "path to file with list of patient IDs, one per line",
                            datatype: 'string',
                            required: true,
                            addressable: false,
                            process: basenode.on({data: handle})
                        }
                      }
                    },
                    { outPorts: { 
                          patient_id: {
                              datatype: 'string'
                          },
                          patient_graph: {
                              datatype: 'string'
                          },
                          meds_graph: {
                              datatype: 'string'
                          },
                          labs_graph: {
                              datatype: 'string'
                          }
                      }
                    }
                  )
      ),
      { description: "Generates patient ID & Graph name information for patients to be loaded",
        icon: 'external-link'
      }
  );
};


function sendIt( port, string ) { 
    console.log('Sending:', string);
    port.send( string );
    port.disconnect();
} 


function handle(file) {

    console.log('handle file:',file);

    var lineReader = require('readline').createInterface({
        input: require('fs').createReadStream(file)
    });

    var outPorts = this.outPorts;
    lineReader.on('line', function (line) {
        var patientId = line; // one patient ID per line
        console.log('Processing patient:', patientId);
        
        sendIt( outPorts.patient_graph, 'urn:test:Patient:'+patientId );
        sendIt( outPorts.meds_graph, 'urn:test:MedicationDispense:'+patientId );
        sendIt( outPorts.labs_graph, 'urn:test:DiagnosticOrder:'+patientId );
        sendIt( outPorts.patient_id, patientId );

        // setTimeout(function(){
                           //open(file);
                       //},delay);

    });
}

