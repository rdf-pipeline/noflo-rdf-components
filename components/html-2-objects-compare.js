/**
 * File:  html-2-objects-compare.js
 *
 * This component generates an HTML file that shows a deep dump of two Javascript objects side by side
 * for easy visual comparison.
 *
 * Data coming into the "left" port will be shown in the left side column; data coming into the "right"
 * port will be shown in the right side column of the HTML page.  The title will be taken from the IIP 
 * constant configuration for each port in the form of {"title":"<column title>"}.
 */
 
var _ = require('underscore');
var util = require('util');
var fs = require('fs');
var open = require('open');

var jswrapper = require('../src/javascript-wrapper');

// Count number of executions.  We don't want to automatically open the comparison file the
// firt time this component executes since it would inhibit viewing the noflo-graph.  Wait until
// second (manually executed)  execution before opening the html comparision file.
var executionCount = 0;

// exports.getComponent = jswrapper({
module.exports = jswrapper({

    description: "Generate an HTML page that compares two JavaScript objects side-by-side for easy visual comparison.",

    inPorts: { 
        file: {
            datatype: 'string',
            description: "path to the html file to be created.",
            required: true
        },
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
     * @param file file path to which the html should be written
     * @param left Javascript object to display on left side of HTML page and an IIP 
     *             setting of format {"title":"<title>"}
     * @param right Javascript object to display on right side of HTML page and an IIP 
     *             setting of format {"title":"<title>"}
     */
    updater: function(file, left, right) {   

        // Verify that we have all data required to generate the html page. 
        // TODO: Revisit and remove this check after more of the pipeline architecture is completed.
        if (shouldFireUpdater(file, left, right)) { 

            // We have both an IIP and port data on these ports.  It can theoretically arrive in any order.
            // sortPortData return an object with a title and a data field so we know what we are referencing
            // henceforth.
            var leftOutput = sortPortData(left, 'left');
            var rightOutput = sortPortData(right, 'right');

            var content = "<html>\n" +
                          "  <head>\n" +
                          "    <title> Comparison of "+leftOutput.title+" &amp; "+rightOutput.title+" Data </title>\n" +
                          "  </head>\n" +
                          "  <body>\n" +
                          "      <table cellpadding='10' width='100%'>\n" +
                          "         <tr>\n" + 
                          "           <th bgcolor='#c8c8c8' width='50%'> " + leftOutput.title + " </th>" + 
                          "           <th bgcolor='#c8c8c8' width='50%'> " + rightOutput.title + " </th>" + 
                          "         </tr>\n" +
                          "         <tr>\n" + 
                          "           <td bgcolor='#e8e8e8'> <pre> "+ util.inspect(leftOutput.data, {depth: null}) + "</pre></td>" +
                          "           <td> <pre> "+ util.inspect(rightOutput.data, {depth: null}) + "</pre></td>";
                          "         </tr>\n" +
                          "      </table>\n" +
                          "  </body>\n" +
                          "</html>";
            fs.writeFileSync(file, content);
    
            if (executionCount > 0) { 
                setTimeout(function(){
                               open(file);
                           },500);
            }
        
            executionCount++;

            return { file: file, 
                     left: left, 
                     right: right };
        }

        return;
    }  

});

/** 
 * Verifies if we have all data now and should execute the updater now. 
 * TODO: Remove this when we handle this in the framework.
 *
 * @param file file path to which the html should be written
 * @param left Javascript object to display on left side of HTML page & an IIP setting with title
 * @param right Javascript object to display on right side of HTML page & an IIP setting with title
 */
function shouldFireUpdater(file, left, right) { 
    return (file && haveAllData(left) && haveAllData(right));
}

/**
 * This updater expects both IIP and packet data on the left and right ports.  This helper function
 * verifies that we have both pieces of data and should proceed.  
 * TODO: Remove this when we handle this in the framework.
 * 
 * @param array an array of port data to check for both IIP and packet data
 * 
 * @return a boolean indicating if we should proceed with updater processing or just return
 */
function haveAllData(array) { 

    // should have a 2 element array
    if (_.isArray(array) && array.length === 2) 

         // neither element should be empty
         if (! (_.isEmpty(array[0]) || _.isEmpty(array[1]))) 
             return true;

    return false;
}

/**
 * Given an array of two inputs (IIP & packet) that may have arrived in any order, determine which is
 * which and create an object that explicitly identifies the title and data with keys by that name
 * 
 * @param array a 2 element array that contains a json title in one element ({"title":"title content"}) 
 *              and a data payload in the other element of any format.
 * @param portName name of the port from which the array payloads come.
 *
 * @return an object containing a title and a data element.
 */
function sortPortData(array,
                       portName) { 

    if (array.length != 2) { 
        throw new Error("Invalid input.  Expected both a title and a data payload on port " + portName + ".");
    }

    var result = {};
    
    for (var i=0, len=array.length; i < len; i++) { 
        if (_.isObject(array[i]) && array[i].hasOwnProperty('title')) { 
            result.title = array[i].title;
        } else {
            result.data = array[i];
        }
    }

    if (_.isUndefined(result.title)) { 
       throw new Error("Invalid input.  Missing the title setting on port " + portName + ".");
    } else if (_.isUndefined(result.data)) { 
       throw new Error("Invalid input.  Missing the input data on port " + portName + ".");
    }

    return result;
}
