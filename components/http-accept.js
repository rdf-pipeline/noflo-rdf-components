// http-accept.js

var _ = require('underscore');
var getRawBody = require('raw-body');
var typer = require('media-typer');

var wrapper = require('../src/javascript-wrapper.js');

module.exports = wrapper({
    description: "Extracts the request body as a String and produces a 202 Accepted response. Optionally, also filters on request content type.",
    icon: 'sign-in',
    outPorts: {
        rejected: {
            description: "HTTP 415 Unsupported Media Type request/response pair {req, res}",
            datatype: 'object'
        },
        accepted: {
            description: "HTTP 202 Accepted request/response pair {req, res}",
            datatype: 'object'
        }
    },
    updater: handle
});

function handle(limit, encoding, type, input) {
    var outPorts = this.nodeInstance.outPorts;
    if (contentTypeMatches(type, input.req.headers['content-type'])) {
        if (_.has(input.req, 'body')) {
            if (outPorts.accepted.listAttached().length) {
                input.res.writeHead(202, "Accepted");
                input.res.write("Accepted");
                outPorts.accepted.send(input);
                outPorts.accepted.disconnect();
            }
            return input.req.body;
        } else {
            var charset = input.req.headers['content-type'] &&
                typer.parse(input.req.headers['content-type']).parameters.charset;
            return getRawBody(input.req, {
                limit: limit || '1mb',
                encoding: charset || encoding || 'utf8'
            }).then(function(body){
                if (outPorts.accepted.listAttached().length) {
                    input.res.writeHead(202, "Accepted");
                    input.res.write("Accepted\n");
                    outPorts.accepted.send(input);
                    outPorts.accepted.disconnect();
                }
                return body;
            }, function(err){
                if (outPorts.rejected.listAttached().length) {
                    input.res.writeHead(413, "Payload Too Large");
                    input.res.write(err.message);
                    outPorts.rejected.send(input);
                    outPorts.rejected.disconnect();
                }
                throw err;
            });
        }
    } else {
        if (outPorts.rejected.listAttached().length) {
            input.res.writeHead(415, "Unsupported Media Type");
            input.res.write("Expected " + type + " not " + input.req.headers['content-type']);
            outPorts.rejected.send(input);
            outPorts.rejected.disconnect();
        }
        throw Error("Expected " + type + " not " + input.req.headers['content-type']);
    }
}

function contentTypeMatches(possible, type) {
    if (_.isEmpty(possible)) return true;
    else if (!type) return false;
    else if (!_.isArray(possible)) return contentTypeMatches([possible], type);
    else return possible.find(function(item){
        if (item == type) return true;
        var base = item.substring(0, item.indexOf('/') + 1);
        var suffix = item.substring(item.indexOf('/') + 1);
        if (base != '*' && type.indexOf(base) !== 0) return false;
        else if (suffix == '*') return true;
        else if (type.indexOf('/' + suffix) > 0) return true;
        else if (type.indexOf('+' + suffix) > 0) return true;
    });
}
