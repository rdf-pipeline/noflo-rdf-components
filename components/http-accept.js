// http-accept.js

var _ = require('underscore');
var body = require('body');
var noflo = require('noflo');

var basenode = require('./base-node');

exports.getComponent = function() {
    return _.extend(new noflo.Component({
        outPorts: {
            out: {
                description: "Request body as a String",
                datatype: 'string'
            },
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
                process: basenode.on({data: basenode.assign('limit')})
            },
            encoding: {
                description: "Request body character encoding",
                datatype: 'string',
                process: basenode.on({data: basenode.assign('encoding')})
            },
            type: {
                description: "Request Content-Type",
                datatype: 'string',
                process: basenode.on({data: basenode.assign('types', basenode.push)})
            },
            'in': {
                description: "HTTP request/response pair {req, res}",
                datatype: 'object',
                required: true,
                process: basenode.on({data: handle})
            }
        }
    }), {
        description: "Extracts the request body as a String and produces a 202 Accepted response. Optionally, also filters on request content type.",
        icon: 'sign-in'
    });
};

function handle(pair){
    var outPorts = this.outPorts;
    if (contentTypeMatches(this.types, pair.req.headers['content-type'])) {
        if (_.has(pair.req, 'body')) {
            if (outPorts.accepted.isAttached()) {
                pair.res.writeHead(202);
                pair.res.write("Accepted");
                outPorts.accepted.send(pair);
                outPorts.accepted.disconnect();
            }
            outPorts.out.send(pair.req.body);
            outPorts.out.disconnect();
        } else {
            body(pair.req, {
                limit: this.limit,
                encoding: this.encoding
            }, function(err, body){
                if (err) {
                    if (outPorts.rejected.isAttached()) {
                        pair.res.writeHead(413);
                        pair.res.write(err.message);
                        outPorts.rejected.send(pair);
                        outPorts.rejected.disconnect();
                    }
                } else {
                    if (outPorts.accepted.isAttached()) {
                        pair.res.writeHead(202);
                        pair.res.write("Accepted\n");
                        outPorts.accepted.send(pair);
                        outPorts.accepted.disconnect();
                    }
                    outPorts.out.send(body);
                    outPorts.out.disconnect();
                }
            });
        }
    } else {
        if (outPorts.rejected.isAttached()) {
            pair.res.writeHead(415);
            pair.res.write("Expected " + this.types + " not " + pair.req.headers['content-type']);
            outPorts.rejected.send(pair);
            outPorts.rejected.disconnect();
        }
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
