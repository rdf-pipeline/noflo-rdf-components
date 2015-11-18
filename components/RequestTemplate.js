// RequestTemplate.js

var _ = require('underscore');
var http = require('http');
var https = require('https');
var url = require('url');
var uriTemplates = require('uri-templates');
var Handlebars = require('handlebars');
var noflo = require('noflo');

exports.getComponent = function() {
    return _.extend(new noflo.Component({
        outPorts: {
            out: {
                description: "Response body when response status is 200/300",
                datatype: 'string',
                required: false,
                addressable: false,
                buffered: false
            },
            error: {
                description: "Response body when response status is 400/500",
                datatype: 'string',
                required: false,
                addressable: false,
                buffered: false
            }
        },
        inPorts: {
            method: {
                description: "HTTP method",
                datatype: 'string',
                required: false,
                addressable: false,
                buffered: false,
                process: on({data: assignUriTemplate('method')})
            },
            url: {
                description: "URI-Template (RFC6570)",
                datatype: 'string',
                required: true,
                addressable: false,
                buffered: false,
                process: on({data: assignUriTemplate('url')})
            },
            headers: {
                description: "Request headers as name:template pairs using the URI-Template syntax",
                datatype: 'object',
                required: false,
                addressable: false,
                buffered: false,
                process: on({data: assignUriTemplate('headers')})
            },
            body: {
                description: "Request body template using the Handlebars syntax",
                datatype: 'string',
                required: false,
                addressable: false,
                buffered: false,
                process: on({data: assignHandlebarsTemplate('body')})
            },
            data: {
                description: "Object data used to populate the templates, but not trigger the request",
                datatype: 'object',
                required: true,
                addressable: false,
                buffered: false,
                process: on({data: merge('base')})
            },
            'in': {
                description: "Object data used to populate the templates and trigger the request",
                datatype: 'object',
                required: true,
                addressable: false,
                buffered: false,
                process: on({data: assign('data'), disconnect: execute})
            }
        }
    }), {
        description: "Initials an HTTP request from uri-template (RFC6570),\
            using object data from the @in port",
        icon: 'external-link'
    });
};

function on(type, callback) {
    return function(event, payload) {
        if (type[event]) type[event].call(this.nodeInstance, payload);
    };
}

function assign(name){
    return function(data){
        this[name] = data;
    };
}

function merge(name){
    return function(data){
        this[name] = _.extend(this[name] || {}, data);
    };
}

function assignUriTemplate(name) {
	return function(template){
	    if (_.isString(template)) {
	        var compiled = new uriTemplates(template);
		    this[name] = function(data){
		        return compiled.fill(data);
		    };
	    } else if (_.isObject(template)) {
	        var compiled = _.mapObject(template, function(temp){
	            return new uriTemplates(temp);
	        });
		    this[name] = function(data){
		        return _.mapObject(compiled, function(comp){
		            return comp.fill(data);
		        });
		    };
	    } else {
		    this[name] = function(data){
		        return template;
		    };
        }
	};
}

function assignHandlebarsTemplate(name) {
	return function(template){
		this[name] = Handlebars.compile(template);
	};
}

function execute() {
	if (!this.url) return _.defer(execute.bind(this));
	var self = this;
	var data = self.base && self.data ? _.extend({}, self.base, self.data) :
	    self.base ? self.base : self.data;
	var options = url.parse(self.url(data));
	var prot = options.protocol == 'https:' ? https : http;
	var req = prot.request(_.extend(options, {
		method: self.method ? self.method(data) : 'GET',
		headers: self.headers(data)
	}), function(res){
		var output = res.statusCode < 400 ?
				self.outPorts.out : self.outPorts.error;
		res.setEncoding('utf8');
	    output.connect();
		res.on('data', function(data){
			output.send(data);
		}).on('end', function(){
			output.disconnect();
		}).on('error', function(e){
			self.outPorts.error.send(e);
		    self.outPorts.error.disconnect();
		});
	}).on('error', function(e){
		self.outPorts.error.send(e);
		self.outPorts.error.disconnect();
	});
	if (self.body) req.write(self.body(data));
	req.end();
}
