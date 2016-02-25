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
 *   },
 *   nodeExt);
 *
 * @param nodeDef The noflo component node definition
 * @param nodeExt Custom extensions to be added to the component node instance that are not part of noflo
 *
 * @return a component factory function that will build the specified noflo component as described
 *         by the nodeDef and nodeExt.
 */
module.exports = function(nodeDef, nodeExt){
    if (!nodeDef) throw Error("No parameter");
    return function() {
        // noflo requires each port and nodeInstance to have its own options object
        var component = new noflo.Component({
            outPorts: _.mapObject(nodeDef.outPorts, _.clone),
            inPorts: _.mapObject(nodeDef.inPorts, _.clone)
        });
        triggerPortDataEvents(component.outPorts);

        component.name = nodeDef.name;
        component.description = nodeDef.description;
        component.setIcon(nodeDef.icon);
        var nodeInstance = access(component);

        registerPorts(nodeInstance.outPorts, nodeDef.outPorts);
        registerPorts(nodeInstance.inPorts, nodeDef.inPorts);
        registerListeners(nodeInstance, nodeDef);

        // If a nodeExt object was defined, extend the node instance with it
        if ( _.isObject( nodeExt ) ) {
            nodeInstance = _.extend( nodeInstance, nodeExt ); 
        }

        return component;
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
 *  registerPorts({portName: new Port()}, {
 *      portName: {
 *          ondata: function(payload, socketIndex)
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
 *      ondata: function(payload, socketIndex)
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
 * @this EventEmitter (Component or Port) that this fn should be registered with
 * @param fn function handler
 * @param name event type prefixed with 'on'
 */
function register(fn, name) {
    this.on(name.substring(2), fn);
}
