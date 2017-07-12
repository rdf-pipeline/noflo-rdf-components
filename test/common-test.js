// common-test.js

/**
 * This file contains the common code used for testing components in the noflo 
 * implementation of the RDF Pipeline.
 */

var chai = require('chai');
var expect = chai.expect;

var noflo = require('noflo');
var _ = require('underscore');
var fs = require('fs');
var logger = require('../src/logger');

before(function() {
    logger.silence('info');
});

after(function() {
    logger.verbose('all');
    logger.silence('debug');
});

module.exports = {

    /**
     * Creates and starts a noflo.Network with a component for every component module
     * given, however, no edges are present.
     * Usage:
     *  createNetwork({name:require('../components/rdf')}).then(function(network){
     *      network.processes.name.component is the component instance
     *      network.graph.addEdge('name', 'output', 'name', 'input') to add edge
     *      network.graph.addInitial(data, 'name', 'input') to send data
     *  });
     */
    createNetwork: function(nodes) {
        var components = _.pick(nodes, _.isObject);
        return new Promise(function(resolve, reject){
            var graph = new noflo.Graph();
            _.each(_.pick(nodes, _.isString), function(componentName, nodeId) {
                // maps nodeId to componentName
                graph.addNode(nodeId, componentName);
            });
            _.each(components, function(module, name) {
                // use the same name for both nodeId and componentName
                graph.addNode(name, name);
            });
            noflo.createNetwork(graph, function(err, network) {
                if (err instanceof noflo.Network) network = err;
                else if (err) return reject(err);
                _.each(components, function(module, componentName) {
                    // maps componentName to module
                    network.loader.components[componentName] = module;
                });
                network.connect(function(err){
                    if (err) return reject(err);
                    network.start(function(err) { 
                       if (err) {
                           console.error("Unable to start network:",err);
                           return reject(err);
                       }
                       return resolve(network);
                    });
                });
            }, true);
        }).then(function(network){
            afterEach(_.once(network.stop.bind(network)));
            return network;
        });
    },

    /**
     * Create a component instance from a factory function or module.
     * @this is not used
     * @param factory a function that creates a Component instance or a module with a getComponent function
     * @usage:
     *  var node = test.createComponent(require('noflo/console'))
     *  var node = test.createComponent(componentFactory({}))
     */
    createComponent: function(factory) {

        var node;
        var metadata = {
            facade: function(facade) {
                node = facade;
            }
        };
        var getComponent = _.isFunction(factory) ? factory : factory.getComponent;
        var component = getComponent(metadata);

        if (node) { // using a facade
            node._component_under_test = component;
        }

        _.forEach(component.inPorts, function(port, name) {
            port.nodeInstance = component;
            port.name = name;
        });

        _.forEach(component.outPorts, function(port, name) {
            port.nodeInstance = component;
            port.name = name;
        });

        // return facade if created, otherwise return the noflo.Component instance
        return node ? node : component;
    },

    detachAllInputSockets: function(node) {

        var component = node._component_under_test ? node._component_under_test : node;
        var portNames = Object.keys(node.inPorts);

        if (portNames) {
             portNames.forEach(function(portName) {
                 var port = component.inPorts[portName];
                 var sockets = port.listAttached();
                 if (_.isArray(sockets) && sockets.length > 0) {
                    sockets.forEach(function(socket) {
                        port.detach(socket);
                    });
                 }
             });
        }
    },

    /** 
     * Log an error message and return an Error that can be used to terminate the test
     * 
     * @param string a tring to be logged and used as the Error message
     * @param e (optional) exception associated with the error message
     * 
     * @return an Error containing the specified string as its message
     */
    error: function(string, e) {

        if (_.isEmpty(e)) { 
            logger.error(string);
        } else { 
            logger.error(string, e);
        }

        return Error(string);
    },

    /**
     * Executes a single promise factory
     *
     * @param network a handle to the noflo network under test
     * @param component component under test within the network
     * @param inputs an array of inputs to be sent to start the test.
     *        Inputs must have:
     *            - payload data to be sent
     *            - component in the network to which payload should be sent
     *            - portName port on the component to which payload should be sent
     * @param validation optional parameter that can be either the expect object result or
     *                   a function to be called to validate the results when promise completes
     */
    executePromise: function(network, component, inputs, validation) {

        // Save the current test context for use within the promise
        var test = this;

        return new Promise(function(done, fail) {

            // Listen to the output and error ports of component under test
            test.onOutPortData(component, 'output', done);
            test.onOutPortData(component, 'error', fail);

            // If we have some inputs, walk the list and send them
            if (!_.isEmpty(inputs)) {

                // send each input to its specified component and port
                inputs.forEach( function(input) {
                    network.graph.addInitial(input.payload, input.componentName, input.portName);
                });
            }

        }).then(function(done) {

           // Are we doing validation?
           if (!_.isUndefined(validation)) {

              if (_.isFunction(validation)) {
                 // Got a function to do validation - call it now
                 validation.call(test, done, inputs);

              } else if (_.isObject(done)) {
                  done.should.deep.equal(validation);
              } else {
                  done.should.equal(validation);
              }

              return done;
           }

        }, function(fail) {
            logger.error('Test failure: ',fail);
            throw Error(fail);
        });
    },

    /**
     *  Process each promise sequentially.
     *
     * @param promiseFactories an array of promise factories that will build and execute a promise
     *
     * @return an array of with the promise results of each factory
     */
    executeSequentially: function(promiseFactories) {
        var result = Promise.resolve();
        var results = [];

        // Execute each promise, one at a time
        promiseFactories.forEach(function (promiseFactory, index) {
           result = result.then(promiseFactory);
           results.push(result);
        });

        // Wait until all promises complete and return the results of each in an array
        return Promise.all(results);
    },

    sendData: function(node, port, payload) {
        var component = node._component_under_test ? node._component_under_test : node;

        var socket = noflo.internalSocket.createSocket();
        component.inPorts[port].attach(socket);

        socket.send(payload);
        socket.disconnect();

        component.inPorts[port].detach(socket);
   },

    onOutPortData: function(node, portName, handler) {
        var component = node._component_under_test ? node._component_under_test : node;
        var socket = noflo.internalSocket.createSocket();
        component.outPorts[portName].attach(socket);
        socket.on('data', handler.bind(node.outPorts[portName]));
    },

    /** 
     * Remove a file if it exists.  Do not throw error if it does not exist.
     * equivalent to rm -f
     */
     rmFile: function(path) { 
         try {  
             fs.unlinkSync(path) 
         } catch(e) { 
             if (e.code !== 'ENOENT') 
                 throw e
         };
     },

    /**
     * Get the expected classpath for the saxon jar depending on the current operating system.
     */
    saxonClasspath: function() {
        switch(process.platform) {
            case 'darwin':
                return '/Library/Java/Extensions/SaxonHE9-7-0-4J/saxon9he.jar';
            case 'linux':
                return '/usr/share/java/saxonb.jar';
            case 'win32':
                return 'c:\saxon\saxon9he.jar';
            default:
                throw Error('Unexpected operating system!');
        }
    },

    /**
     * Verify that the specified file is executable
     *
     * @param filepath filepath to test for execute access
     */
    verifyExecutable: function(filepath) {

        filepath.should.exist;

        var mode = fs.statSync(filepath).mode;

        var owner = mode >> 6;
        var group = (mode << 3) >> 6;
        var others = (mode << 6) >> 6;

        var permissions = {
            read: {
                owner: !!(owner & 4),
                group: !!(group & 4),
                others: !!(others & 4)
            },
            execute: {
                owner: !!(owner & 1),
                group: !!(group & 1),
                others: !!(others & 1)
            }
        };

        permissions.read.owner.should.be.true;
        permissions.read.group.should.be.true;
        permissions.read.others.should.be.true;

        permissions.execute.owner.should.be.true;
        permissions.execute.group.should.be.true;
        permissions.execute.others.should.be.true;
    },

    /**
     * Verifies that the state has the expected vnid & data and the lm is
     * structured as an lm should be.
     */
    verifyState: function(state, expectedVnid, expectedData, expectedError, expectedStale, expectedGroupLm) { 
        state.should.be.an('object');
        state.should.include.keys('vnid', 'lm','data','error','stale', 'groupLm');
        state.vnid.should.equal(expectedVnid);
        expect(state.data).to.deep.equal(expectedData);
        state.lm.should.be.a('string');
        state.lm.should.not.be.empty;
        expect(state.error).to.equal(expectedError);
        expect(state.stale).to.equal(expectedStale);
        expect(state.groupLm).to.equal(expectedGroupLm);
        var lmComponents = state.lm.match(/^LM(\d+)\.(\d+)$/);
        lmComponents.should.have.length(3);
    }

};
