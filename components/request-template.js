// request-template.js

var _ = require('underscore');
var http = require('http');
var https = require('https');
var url = require('url');
var uriTemplates = require('uri-templates');
var Handlebars = require('handlebars');

var basenode = require('./base-node');
var promiseComponent = require('./promise-component');

exports.getComponent = promiseComponent({
    description: "Initials an HTTP request from uri-template (RFC6570),\
        using object data from the @in port",
    icon: 'external-link',
    resolvePort: {
        name: 'out',
        description: "Response body when response status is 200/300",
        datatype: 'string'
    },
    rejectPort: {
        name: 'error',
        description: "Response body when response status is 400/500",
        datatype: 'object'
    },
    inPorts: {
        method: {
            description: "HTTP method",
            datatype: 'string',
            ondata: basenode.assign('method', newUriTemplate)
        },
        url: {
            description: "URI-Template (RFC6570)",
            datatype: 'string',
            required: true,
            ondata: basenode.assign('url', newUriTemplate)
        },
        headers: {
            description: "Request headers as name:template pairs using the URI-Template syntax",
            datatype: 'object',
            ondata: basenode.assign('headers', newUriTemplate)
        },
        body: {
            description: "Request body template using the Handlebars syntax",
            datatype: 'string',
            ondata: basenode.assign('body', Handlebars.compile)
        },
        parameters: {
            description: "Object data used to populate the templates, but not trigger the request",
            datatype: 'object',
            required: true,
            ondata: basenode.assign('parameters', _.defaults)
        },
        'in': {
            description: "Object data used to populate the templates and trigger the request",
            datatype: 'object',
            required: true,
            ondata: basenode.assign('data', _.defaults),
            ondisconnect: execute
        }
    }
});

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
    var self = this;
    if (!this.url) return new Promise(function(resolve, reject) {
        _.defer(function(){
            execute.call(self).then(resolve, reject);
        });
    });
    var data = _.defaults({}, this.data || {}, this.parameters);
    if (this.data) this.data = null; // clear for next dataset
    var options = _.extend(url.parse(this.url(data)), {
        method: this.method ? this.method(data) : 'GET',
        headers: this.headers(data)
    });
    var body = this.body;
    var prot = options.protocol == 'https:' ? https : http;
    return new Promise(function(resolve, reject) {
        var req = prot.request(options, function(res){
            res.setEncoding('utf8');
            var buffer = [];
            res.on('data', function(data){
                buffer.push(data);
            }).on('end', function(){
                if (res.statusCode < 400) {
                    resolve(buffer.join(''));
                } else {
                    reject(buffer.join(''));
                }
            }).on('error', reject);
        }).on('error', reject);
        if (body) req.write(body(data));
        req.end();
    });
}
