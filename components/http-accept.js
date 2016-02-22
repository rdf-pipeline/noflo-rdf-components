// http-accept.js

var _ = require('underscore');
var getRawBody = require('raw-body');
var typer = require('media-typer');

var promiseOutput = require('../src/promise-output');
var componentFactory = require('../src/noflo-component-factory');

exports.getComponent = componentFactory({
    description: "Extracts the request body as a String and produces a 202 Accepted response. Optionally, also filters on request content type.",
    icon: 'sign-in',
    outPorts: _.defaults({
        rejected: {
            description: "HTTP 415 Unsupported Media Type request/response pair {req, res}",
            datatype: 'object'
        },
        accepted: {
            description: "HTTP 202 Accepted request/response pair {req, res}",
            datatype: 'object'
        }
    }, promiseOutput.outPorts),
    inPorts: {
        limit: {
            description: "Request Content-Length limit",
            datatype: 'int',
            ondata: function(limit) {
                this.nodeInstance.limit = limit;
            }
        },
        encoding: {
            description: "Request body character encoding",
            datatype: 'string',
            ondata: function(encoding) {
                this.nodeInstance.encoding = encoding;
            }
        },
        type: {
            description: "Request Content-Type",
            datatype: 'string',
            ondata: function(type) {
                this.nodeInstance.types = this.nodeInstance.types || [];
                this.nodeInstance.types.push(type);
            }
        },
        input: {
            description: "HTTP request/response pair {req, res}",
            datatype: 'object',
            required: true,
            ondata: promiseOutput(handle)
        }
    }
});

function handle(pair){
    var self = this.nodeInstance;
    var outPorts = this.nodeInstance.outPorts;
    if (contentTypeMatches(self.types, pair.req.headers['content-type'])) {
        if (_.has(pair.req, 'body')) {
            if (outPorts.accepted.isAttached()) {
                pair.res.writeHead(202, "Accepted");
                pair.res.write("Accepted");
                outPorts.accepted.send(pair);
                outPorts.accepted.disconnect();
            }
            return pair.req.body;
        } else {
            var charset = pair.req.headers['content-type'] &&
                typer.parse(pair.req.headers['content-type']).parameters.charset;
            return getRawBody(pair.req, {
                limit: self.limit || '1mb',
                encoding: charset || self.encoding || 'utf8'
            }).then(function(body){
                if (outPorts.accepted.isAttached()) {
                    pair.res.writeHead(202, "Accepted");
                    pair.res.write("Accepted\n");
                    outPorts.accepted.send(pair);
                    outPorts.accepted.disconnect();
                }
                return body;
            }, function(err){
                if (outPorts.rejected.isAttached()) {
                    pair.res.writeHead(413, "Payload Too Large");
                    pair.res.write(err.message);
                    outPorts.rejected.send(pair);
                    outPorts.rejected.disconnect();
                }
                throw err;
            });
        }
    } else {
        if (outPorts.rejected.isAttached()) {
            pair.res.writeHead(415, "Unsupported Media Type");
            pair.res.write("Expected " + self.types + " not " + pair.req.headers['content-type']);
            outPorts.rejected.send(pair);
            outPorts.rejected.disconnect();
        }
        throw Error("Expected " + self.types + " not " + pair.req.headers['content-type']);
    }
}

function contentTypeMatches(possible, type) {
    if (_.isEmpty(possible)) return true;
    else if (!type) return false;
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
