// noflo-component-factory.js

var _ = require('underscore');
var noflo = require('noflo');
var access = require('./noflo-component-access');

/**
 * Creates a noflo Component factory function from a component definition,
 * registers any event handlers on definition. Triggers ondata events for outPorts.
 * The context of all registered event handlers is of a Component/Port facade and
 * not of the EventEmitter itself. This prevents the caller from gaining access
 * to private areas of noflo internals.
 *
 * Usage:
 *  componentFactory({
 *      description: "text",
 *      icon: 'fontawesome-icon-name',
 *      inPorts: {
 *          portName: {
 *              ondata: function(payload, socketIndex)
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
module.exports = function(nodeDef, callback){
    if (!nodeDef) throw Error("No parameter");
    return function(metadata) {
        // noflo requires each port and nodeInstance to have its own options object
        var node = new noflo.Component({
            outPorts: _.mapObject(nodeDef.outPorts, _.clone),
            inPorts: _.mapObject(nodeDef.inPorts, _.clone)
        });
        triggerPortDataEvents(node.outPorts);
        var facade = access(node);
        registerPorts(node.outPorts, facade.outPorts, nodeDef.outPorts);
        registerPorts(node.inPorts, facade.inPorts, nodeDef.inPorts);
        registerListeners(node, facade, nodeDef);
        node.description = nodeDef.description;
        node.setIcon(nodeDef.icon);
        if (_.isFunction(callback)) {
            callback.call(node, facade);
        }
        // Used by common-test.js#createComponent to gain access to the facade
        if (metadata && _.isFunction(metadata.facade)) {
            metadata.facade.call(node, facade);
        }
        return node;
    };
};

/**
 * Fires data event when OutPort send function is called on port.
 */
function triggerPortDataEvents(ports) {
    _.each(ports, function(port) {
        if (_.isFunction(port.send)) {
            port.send = _.partial(thenTrigger, port.send, 'data');
        }
    });
}

/**
 * Emit event after function is called
 * @this Port object sending the payload
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
 *  registerPorts({portName: new Port()}, {portName: new PortFacade()}, {
 *      portName: {
 *          ondata: function(payload, socketIndex)
 *      }
 *  });
 */
function registerPorts(ports, facades, portDefs) {
    _.each(portDefs, function(portDef, name) {
        registerListeners(ports[name], facades[name], portDef);
    });
}

/**
 * Registers listeners by their event type to this EventEmitter.
 * @param eventEmitter a noflo.Component/Port
 * @param context the facade that the listeners should be bound to
 * @param listeners a hash of event types (prefixed with 'on') to handlers
 * Usage:
 *  registerListeners(new EventEmitter(), facade, {
 *      ondata: function(payload, socketIndex)
 *  });
 */
function registerListeners(eventEmitter, context, listeners) {
    var handlers = _.pick(listeners, isListener);
    var boundHandlers = _.mapObject(handlers, bindThis, context);
    _.each(boundHandlers, register, eventEmitter);
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
 * Returns the given function with the context bound to this context.
 * This is needed to ensure that the event handlers are always bound to the facade
 * and not to the underlying noflo Component/Port.
 * @this The component/port facade
 * @param fn the event handler function
 */
function bindThis(fn) {
    return fn.bind(this);
}

/**
 * Registers the function handler with the event type for this EventEmitter.
 * @this EventEmitter (Component or Port) that this fn should be registered with
 * @param fn function handler
 * @param name event type prefixed with 'on'
 */
function register(fn, name) {
    this.on(name.substring(2), fn);
}
