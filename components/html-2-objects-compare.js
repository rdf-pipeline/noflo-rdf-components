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

exports.getComponent = jswrapper({

    name: "html-2-objects-compare",
    description: "Generate an HTML page that compares two JavaScript objects side-by-side for easy visual comparison.",

    inPorts: { 
        file: {
            datatype: 'string',
            description: "path to the html file to be created.",
            required: true
        },
        labels: {
            datatype: 'object',
            description: "a JavaScript object defining the page title and column header labels.",
            required: true
        },
        left: { 
            datatype: 'object',
            description: "a JavaScript object to display on the left side side of the HTML page.",
            required: true
        },
        right: { 
            datatype: 'object',
            description: "a JavaScript object to display on the right side side of the HTML page.",
            required: true
        }
    },

    /**
     * This updater will generate a simple HTML page that visually displays the content of 
     * both the left and right objects.
     *
     * @param file file path to which the html should be written
     * @param labels 
     * @param left Javascript object to display on left side of HTML page and an IIP 
     *             setting of format {"title":"<title>"}
     * @param right Javascript object to display on right side of HTML page and an IIP 
     *             setting of format {"title":"<title>"}
     */
    updater: function( file, labels, left, right ) {   

            this.executions = this.executions | 0;

            var content = "<html>\n" +
                          "  <head>\n" +
                          "    <title> "+ labels.title +" </title>\n" +
                          "  </head>\n" +
                          "  <body>\n" +
                          "      <table cellpadding='10' width='100%'>\n" +
                          "         <tr>\n" +
                          "           <th bgcolor='#c8c8c8' width='50%'> "+labels.left+" </th>" +
                          "           <th bgcolor='#c8c8c8' width='50%'> "+labels.right+" </th>" +
                          "         </tr>\n" +
                          "         <tr>\n" +
                          "           <td valign='top' bgcolor='#e8e8e8'> <pre> "+ util.inspect( left, {depth: null} ) + "</pre></td>" +
                          "           <td valign='top'> <pre> "+ util.inspect( right, {depth: null} ) + "</pre></td>";
                          "         </tr>\n" +
                          "      </table>\n" +
                          "  </body>\n" +
                          "</html>";

            fs.writeFileSync(file, content);
    
            if (this.executions > 0) { 
                setTimeout(function(){
                               open(file);
                           },500);
            }
        
            this.executions++;

            return { file: file, 
                     left: left, 
                     right: right };

        return;
    }  

});
