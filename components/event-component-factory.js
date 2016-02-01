// component-factory.js

var _ = require('underscore');
var noflo = require('noflo');

/**
 * Creates a noflo Component factory function from a component definitation,
 * registers any event handlers on definitation. Triggers ondata events for outPorts.
 *
 * Usage:
 *  componentFactory({
 *      description: "text",
 *      icon: 'fontawesome-icon-name',
 *      inPorts: {
 *          portName: {
 *              ondata: function(payload)
 *          }
 *      },
 *      outPorts: {
 *          portName: {
 *              ondata: function(payload)
 *          }
 *      },
 *      onicon: function(icon)
 *   });
 */
module.exports = function(def){
    if (!def) throw Error("No parameter");
    return function() {
        // noflo requires each port and nodeInstance to have its own options object
        var nodeInstance = new noflo.Component({
            outPorts: _.mapObject(def.outPorts, _.clone),
            inPorts: _.mapObject(def.inPorts, _.clone)
        });
        triggerPortEvents(nodeInstance.outPorts);
        registerPorts(nodeInstance.outPorts, def.outPorts);
        registerPorts(nodeInstance.inPorts, def.inPorts);
        registerListeners(nodeInstance, def);
        nodeInstance.description = def.description;
        nodeInstance.setIcon(def.icon);
        return nodeInstance;
    };
};

/**
 * Fires events when OutPort functions are called on port.
 */
function triggerPortEvents(ports) {
    _.each(ports, function(port) {
        // attach and detach already trigger events
        port.connect = _.partial(thenTrigger, port.connect, 'connect');
        port.beginGroup = _.partial(thenTrigger, port.beginGroup, 'begingroup');
        port.send = _.partial(thenTrigger, port.send, 'data');
        port.endGroup = _.partial(thenTrigger, port.endGroup, 'endgroup');
        port.disconnect = _.partial(thenTrigger, port.disconnect, 'disconnect');
    });
}

/**
 * Emit event after function is called
 * @param fn function to call
 * @param event event to emit
 */
function thenTrigger(fn, event /* arguments to fn and event */) {
    var args = _.toArray(arguments).slice(2);
    var ret = fn.apply(this, args);
    this.emit.apply(this, [].concat(event, args));
    return ret;
}

/**
 * Register listeners of the set of port definitions with this actual noflo Ports set.
 *
 * Usage:
 *  registerPorts({portName: new Port()}, {
 *      portName: {
 *          ondata: function(payload)
 *      }
 *  });
 */
function registerPorts(ports, portDefs) {
    _.each(portDefs, function(port, name) {
        _.each(_.pick(port, isListener), register.bind(ports[name]));
    });
}

/**
 * Registers listers by their event type to this EventEmitter.
 * Usage:
 *  registerListeners(new EventEmitter(), {
 *      ondata: function(payload)
 *  });
 */
function registerListeners(eventEmitter, listeners) {
    _.each(_.pick(listeners, isListener), register.bind(eventEmitter));
}

/**
 * Checks the given function and that name starts with 'on'.
 * @param fn is a function if result is true
 * @param name starts with 'on' if result is true
 */
function isListener(fn, name) {
    return _.isFunction(fn) && name.indexOf('on') === 0;
}

/**
 * Registers the function handler with the event type for this EventEmitter.
 * @param fn function handler
 * @param name event type prefixed with 'on'
 */
function register(fn, name) {
    this.on(name.substring(2), fn);
}
