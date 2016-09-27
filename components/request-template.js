// request-template.js

var _ = require('underscore');
var http = require('http');
var https = require('https');
var URL = require('url');
var uriTemplates = require('uri-templates');
var Handlebars = require('handlebars');

var logger = require('../src/logger');
var wrapper = require('../src/javascript-wrapper');

/**
 * Initials an HTTP request from uri-template (RFC6570), using object data from
 * the @in port. Resolve 200/300 response body or rejects 400/500 response body
 * @param method HTTP method
 * @param url URI-Template (RFC6570)
 * @param headers Request headers as name:template pairs using the URI-Template syntax
 * @param body Request body template using the Handlebars syntax
 * @param parameters Object data used to populate the templates, but not trigger the request
 * @param input Object data used to populate the templates and trigger the request
 */
module.exports = wrapper({
    description: "Initials an HTTP request from uri-template (RFC6570),\
        using object data from the @in port. Resolve 200/300 response body or rejects 400/500 response body",
    icon: 'external-link',
    inPorts: {
        method: {
            description: "HTTP method",
            datatype: 'string'
        },
        url: {
            description: "URI-Template (RFC6570)",
            datatype: 'string'
        },
        headers: {
            description: "Request headers as name:template pairs using the URI-Template syntax",
            datatype: 'object',
            multi: true
        },
        body: {
            description: "Request body template using the Handlebars syntax",
            datatype: 'string'
        },
        parameters: {
            description: "Object data used to populate the templates, but not trigger the request",
            datatype: 'object',
            multi: true
        },
        input: {
            description: "Object data used to populate the templates and trigger the request",
            datatype: 'object'
        }
    },
    updater: execute
});

function newUriTemplate(template){
    if (_.isString(template)) {
        var compiled = new uriTemplates(template);
        return compiled.fill.bind(compiled);
    } else if (_.isArray(template)) {
        var compiled = _.map(template, function(temp){
            return newUriTemplate(temp);
        });
        return function(data){
            return _.map(compiled, function(comp){
                return comp(data);
            });
        };
    } else if (_.isObject(template)) {
        var compiled = _.mapObject(template, function(temp){
            return newUriTemplate(temp);
        });
        return function(data){
            return _.mapObject(compiled, function(comp){
                return comp(data);
            });
        };
    } else {
        return _.constant(template);
    }
}

function execute(method, url, headers, body, parameters, input) {
    var t_method = method && newUriTemplate(method);
    var t_url = url && newUriTemplate(url);
    var t_headers = !_.isEmpty(headers) && newUriTemplate(headers);
    var t_body = body && Handlebars.compile(body);
    var self = this.nodeInstance || this;
    var data = _.extend.apply(_, [{}].concat(parameters, [input]));
    var http_headers = _.extend.apply(_, [{}].concat(t_headers ? t_headers(data) : []));
    if (!t_url) throw Error("URL is required " + _.toArray(arguments).join(','));
    var options = _.extend(URL.parse(t_url(data)), {
        method: t_method ? t_method(data) : 'GET',
        headers: _.omit(http_headers, _.isEmpty)
    });

    logger.debug('options', {options: options, nodeInstance: this.nodeInstance});

    return promiseThrottledContent(options, t_body ? t_body(data) : null);
}

var promiseThrottledContent = throttlePromise(promiseContent);

function promiseContent(options, body) {
    return new Promise(function(resolve, reject) {
        var prot = options.protocol == 'https:' ? https : http;
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
        if (body) req.write(body);
        req.end();
    });
}

function throttlePromise(fn, limit) {
    var max = limit || 1;
    var currently = 0;
    var queue = [];
    var next = function(){
        if (currently < max && queue.length) {
            currently++;
            queue.shift().call();
        }
    };
    return function(/* arguments */) {
        var context = this;
        var args = arguments;
        return new Promise(function(callback){
            queue.push(callback);
            next();
        }).then(function(){
            return fn.apply(context, args);
        }).then(function(result){
            currently--;
            next();
            return result;
        }, function(error){
            currently--;
            next();
            return Promise.reject(error);
        });
    };
}
