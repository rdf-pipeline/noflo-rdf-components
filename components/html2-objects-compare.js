/**
 * File:  html-2-objects-compare.js
 */
 
var _ = require('underscore');
var util = require('util');
var fs = require('fs');
var open = require('open');

var jswrapper = require('../src/JavaScript-wrapper');

// Count number of executions.  We don't want to automatically open the comparison file the
// firt time this component executes since it would inhibit viewing the noflo-graph.  Wait until
// second (manually executed)  execution before opening the comparision file.
var executionCount = 0;

exports.getComponent = jswrapper({

    description: "Generate an HTML page that compares two JavaScript objects side-by-side for easy visual comparison.",

    inPorts: { 
        left: { 
            datatype: 'object',
            description: "a JavaScript object to display on the left side side of the HTML page.",
            addressable: true,
            required: true
        },
        right: { 
            datatype: 'object',
            description: "a JavaScript object to display on the right side side of the HTML page.",
            addressable: true,
            required: true
        }
    },

    /**
     * This updater will generate a simple HTML page that visually displays the content of 
     * both the left and right objects.
     *
     * @param left Javascript object to display on left side of HTML page
     * @param right Javascript object to display on right side of HTML page
     */
    updater: function( left, right ) {   

        if ( left.length === 2 && right.length == 2 ) { 

            // We have both an IIP and port data on these ports.  It can theoretically arrive in any order.
            // sortPortData return an object with a title and a data field so we know what we are referencing
            // henceforth.
            var leftOutput = sortPortData( left );
            var rightOutput = sortPortData( right );

            var content = "<html>\n" +
                          "  <head>\n" +
                          "    <title> Comparison of "+leftOutput.title+" & "+rightOutput.title+" Data </title>\n" +
                          "  </head>\n" +
                          "  <body>\n" +
                          "      <table cellpadding='10' width='100%'>\n" +
                          "         <tr>\n" + 
                          "           <th bgcolor='#c8c8c8' width='50%'> " + leftOutput.title + " </th>" + 
                          "           <th bgcolor='#c8c8c8' width='50%'> " + rightOutput.title + " </th>" + 
                          "         </tr>\n" +
                          "         <tr>\n" + 
                          "           <td bgcolor='#e8e8e8'> <pre> "+ util.inspect( leftOutput.data, {depth: null} ) + "</pre></td>" +
                          "           <td> <pre> "+ util.inspect( rightOutput.data, {depth: null} ) + "</pre></td>";
                          "         </tr>\n" +
                          "      </table>\n" +
                          "  </body>\n" +
                          "</html>";
            fs.writeFileSync('/tmp/comparison.html', content);
    
            if (executionCount > 0) { 
                setTimeout(function(){
                               open('/private/tmp/comparison.html');
                           },500);
            }
        
            executionCount++;

            return right;
        }
    }  
});

function sortPortData( array ) { 
    var result = {};
    
    for (var i=0, len=array.length; i < len; i++ ) { 
        if ( _.isObject( array[i] ) && array[i].hasOwnProperty( 'title' )) { 
            result['title'] = array[i].title;
        } else {
            result['data'] = array[i];
        }
    }
    return result;
}
