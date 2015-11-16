// RequestTemplate.js

var _ = require('underscore');
var http = require('http');
var https = require('https');
var url = require('url');
var uriTemplates = require('uri-templates');
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
                process: ondata(assignTemplate('method'))
            },
            url: {
                description: "URI-Template (RFC6570)",
                datatype: 'string',
                required: true,
                addressable: false,
                buffered: false,
                process: ondata(assignTemplate('url'))
            },
            headers: {
                description: "Request headers",
                datatype: 'string',
                required: false,
                addressable: false,
                buffered: false,
                process: ondata(assignTemplate('headers'))
            },
            body: {
                description: "Request body template",
                datatype: 'string',
                required: false,
                addressable: false,
                buffered: false,
                process: ondata(assignTemplate('body'))
            },
            'in': {
                description: "Object data used to populate the templates",
                datatype: 'object',
                required: true,
                addressable: false,
                buffered: false,
                process: ondata(received)
            }
        }
    }), {
        description: "Initials an HTTP request from uri-template (RFC6570),\
            using object data from the @in port",
        icon: 'external-link'
    });
};

function ondata(callback) {
	return function(event, payload) {
	    switch(event) {
		    case 'data': return callback.call(this.nodeInstance, payload);
		};
	};
}

function assignTemplate(name) {
	return function(data){
		this[name] = compileTemplate(data);
	};
}

function compileTemplate(template) {
	if (_.isString(template)){
		return new uriTemplates(template);
	} else if (_.isObject(template)) {
		return _.object(_.keys(template), _.values(template).map(compileTemplate));
	} else {
		return template;
	}
}

function received(data) {
	var self = this;
	var options = url.parse(self.url.fill(data));
	var prot = options.protocol == 'https:' ? https : http;
	var req = prot.request(_.extend(options, self.headers, {
		method: self.method ? self.method.fill(data) : 'GET'
	}), function(res){
		var output = res.statusCode < 400 ?
				self.outPorts.out : self.outPorts.error;
		res.setEncoding('utf8');
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
	if (self.body) req.write(self.body.fill(data));
	req.end();
}
