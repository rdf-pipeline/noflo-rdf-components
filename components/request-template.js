// request-template.js

var _ = require('underscore');
var http = require('http');
var https = require('https');
var url = require('url');
var uriTemplates = require('uri-templates');
var Handlebars = require('handlebars');
var noflo = require('noflo');

var basenode = require('./base-node');

exports.getComponent = function() {
    return _.extend(new noflo.Component({
        outPorts: {
            out: {
                description: "Response body when response status is 200/300",
                datatype: 'string'
            },
            error: {
                description: "Response body when response status is 400/500",
                datatype: 'object'
            }
        },
        inPorts: {
            method: {
                description: "HTTP method",
                datatype: 'string',
                process: basenode.on({data: basenode.assign('method', newUriTemplate)})
            },
            url: {
                description: "URI-Template (RFC6570)",
                datatype: 'string',
                required: true,
                process: basenode.on({data: basenode.assign('url', newUriTemplate)})
            },
            headers: {
                description: "Request headers as name:template pairs using the URI-Template syntax",
                datatype: 'object',
                process: basenode.on({data: basenode.assign('headers', newUriTemplate)})
            },
            body: {
                description: "Request body template using the Handlebars syntax",
                datatype: 'string',
                process: basenode.on({data: basenode.assign('body', Handlebars.compile)})
            },
            parameters: {
                description: "Object data used to populate the templates, but not trigger the request",
                datatype: 'object',
                required: true,
                process: basenode.on({data: basenode.assign('parameters', _.defaults)})
            },
            data: {
                description: "Use parameters port instead",
                datatype: 'object',
                process: basenode.on({data: basenode.assign('parameters', _.defaults)})
            },
            'in': {
                description: "Object data used to populate the templates and trigger the request",
                datatype: 'object',
                required: true,
                process: basenode.on({
                    data: basenode.assign('data', _.defaults),
                    disconnect: execute
                })
            }
        }
    }), {
        description: "Initials an HTTP request from uri-template (RFC6570),\
            using object data from the @in port",
        icon: 'external-link'
    });
};

function newUriTemplate(template){
    if (_.isString(template)) {
        var compiled = new uriTemplates(template);
        return compiled.fill.bind(compiled);
    } else if (_.isObject(template)) {
        var compiled = _.mapObject(template, function(temp){
            return newUriTemplate(temp);
        });
        return function(data){
            return _.mapObject(compiled, function(comp){
                return comp(data);
            });
        };
    } else if (_.isArray(template)) {
        var compiled = _.map(template, function(temp){
            return newUriTemplate(temp);
        });
        return function(data){
            return _.map(compiled, function(comp){
                return comp(data);
            });
        };
    } else {
        return _.constant(template);
    }
}

function execute() {
    if (!this.url) return _.defer(execute.bind(this));
    var outPorts = this.outPorts;
    var data = _.defaults(this.data || {}, this.parameters);
    if (this.data) this.data = null; // clear for next dataset
    var options = url.parse(this.url(data));
    var prot = options.protocol == 'https:' ? https : http;
    var req = prot.request(_.extend(options, {
        method: this.method ? this.method(data) : 'GET',
        headers: this.headers(data)
    }), function(res){
        var output = res.statusCode < 400 ?
                outPorts.out : outPorts.error;
        res.setEncoding('utf8');
        output.connect();
        res.on('data', function(data){
            output.send(data);
        }).on('end', function(){
            output.disconnect();
        }).on('error', function(e){
            outPorts.error.send(e);
            outPorts.error.disconnect();
        });
    }).on('error', function(e){
        outPorts.error.send(e);
        outPorts.error.disconnect();
    });
    if (this.body) req.write(this.body(data));
    req.end();
}
