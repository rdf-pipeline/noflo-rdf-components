// http-accept.js

var _ = require('underscore');
var getRawBody = require('raw-body');
var typer = require('media-typer');

var basenode = require('../src/base-node');
var promiseComponent = require('../src/promise-component');

exports.getComponent = promiseComponent({
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
    inPorts: {
        limit: {
            description: "Request Content-Length limit",
            datatype: 'int',
            ondata: basenode.assign('limit')
        },
        encoding: {
            description: "Request body character encoding",
            datatype: 'string',
            ondata: basenode.assign('encoding')
        },
        type: {
            description: "Request Content-Type",
            datatype: 'string',
            ondata: basenode.assign('types', basenode.push)
        },
        'in': {
            description: "HTTP request/response pair {req, res}",
            datatype: 'object',
            required: true,
            ondata: handle
        }
    }
});

function handle(pair){
    var outPorts = this.outPorts;
    if (contentTypeMatches(this.types, pair.req.headers['content-type'])) {
        if (_.has(pair.req, 'body')) {
            if (outPorts.accepted.isAttached()) {
                pair.res.writeHead(202, "Accepted");
                pair.res.write("Accepted");
                outPorts.accepted.send(pair);
                outPorts.accepted.disconnect();
            }
            return pair.req.body;
        } else {
            var charset = typer.parse(pair.req.headers['content-type']).parameters.charset;
            return getRawBody(pair.req, {
                limit: this.limit || '1mb',
                encoding: charset || this.encoding || 'utf8'
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
            pair.res.write("Expected " + this.types + " not " + pair.req.headers['content-type']);
            outPorts.rejected.send(pair);
            outPorts.rejected.disconnect();
        }
        throw Error("Expected " + this.types + " not " + pair.req.headers['content-type']);
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
