// request-template.js

var _ = require('underscore');
var http = require('http');
var https = require('https');
var url = require('url');
var uriTemplates = require('uri-templates');
var Handlebars = require('handlebars');

var promiseOutput = require('../src/promise-output');
var componentFactory = require('../src/noflo-component-factory');

exports.getComponent = componentFactory({
    description: "Initials an HTTP request from uri-template (RFC6570),\
        using object data from the @in port. Resolve 200/300 response body or rejects 400/500 response body",
    icon: 'external-link',
    outPorts: promiseOutput.outPorts,
    inPorts: {
        method: {
            description: "HTTP method",
            datatype: 'string',
            ondata: function(method) {
                this.nodeInstance.method = newUriTemplate(method);
            }
        },
        url: {
            description: "URI-Template (RFC6570)",
            datatype: 'string',
            required: true,
            ondata: function(url) {
                this.nodeInstance.url = newUriTemplate(url);
            }
        },
        headers: {
            description: "Request headers as name:template pairs using the URI-Template syntax",
            datatype: 'object',
            ondata: function(headers) {
                this.nodeInstance.headers = newUriTemplate(headers);
            }
        },
        body: {
            description: "Request body template using the Handlebars syntax",
            datatype: 'string',
            ondata: function(body) {
                this.nodeInstance.body = Handlebars.compile(body);
            }
        },
        parameters: {
            description: "Object data used to populate the templates, but not trigger the request",
            datatype: 'object',
            ondata: function(parameters) {
                this.nodeInstance.parameters = _.defaults(parameters, this.nodeInstance.parameters);
            }
        },
        input: {
            description: "Object data used to populate the templates and trigger the request",
            datatype: 'object',
            required: true,
            ondata: function(data) {
                this.nodeInstance.data = _.defaults(data, this.nodeInstance.data);
            },
            ondisconnect: promiseOutput(execute)
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
    var self = this.nodeInstance || this;
    if (!self.url) return new Promise(function(resolve, reject) {
        _.defer(function(){
            execute.call(self).then(resolve, reject);
        });
    });
    var data = _.defaults({}, self.data || {}, self.parameters);
    if (self.data) self.data = null; // clear for next dataset
    var options = _.extend(url.parse(self.url(data)), {
        method: self.method ? self.method(data) : 'GET',
        headers: self.headers ? self.headers(data) : []
    });
    var body = self.body;
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
