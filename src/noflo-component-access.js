// noflo-component-access.js

var _ = require('underscore');
var noflo = require('noflo');

module.exports = facadeComponent;

/**
 * Create a noflo.Component facade from a given component. Access to the component
 * is limited to only select properties and functions. An rpf hash property is
 * also present for arbitrary assignments and is shared for all facades of the
 * same Component instance.
 * This facade mimic the main usage of http://noflojs.org/api/Component.html
 * Usage:
 *  var component = componentAccess(new noflo.Component());
 */
function facadeComponent(component) {
    if (component._noflo_access_facade)
        return component._noflo_access_facade;
    var facade = {};
    _.extend(facade, {
        inPorts: _.mapObject(_.pick(component.inPorts, isInPort), facadePort.bind(this, facade)),
        outPorts: _.mapObject(_.pick(component.outPorts, isOutPort), facadePort.bind(this, facade))
    }, facadeEventEmitter(component));
    return component._noflo_access_facade = facade;
}

/**
 * Create a noflo Port facade from a given noflo Port that includes only a limited
 * subset of properties and functions.
 * This facade mimic the main usage of http://noflojs.org/api/OutPort.html
 */
function facadePort(nodeInstance, port, name) {
    return _.extend({
        name: name,
        nodeInstance: nodeInstance,
        isMulti: port.isAddressable.bind(port)
    }, facadeFunctions(port,
        'isAddressable',
        'isRequired',
        'listAttached',
        'connect',
        'send',
        'disconnect'
    ), facadeEventEmitter(port));
}

/**
 * Returns a facade of the given EventEmitter. The result is not an EventEmitter,
 * but includes the same functions. Each function call is passed to the underlying
 * EventEmitter, while any provided functions are bound to the original context
 * when they are called. This gives the behaviour of an EventEmitter without
 * actually creating one with a distinct state.
 * @see https://nodejs.org/dist/latest-v4.x/docs/api/events.html
 */
function facadeEventEmitter(emitter) {
    return facadeFunctions(emitter,
        'emit',
        'on',
        'once',
        'removeListener'
    );
}

/**
 * Picks all the given functions from object and returns the set bounded to the
 * original object context. If any argument is passed to those functions that is
 * also a function it is bound to the called context.
 * @param object with functions, i.e. noflo.Component, noflo.InPort/OutPort
 * @param keys explicit names of functions to include in result
 */
function facadeFunctions(object /* keys */) {
    var keys = _.toArray(arguments).slice(1);
    return _.mapObject(_.pick(object, keys), function(fn) {
        return _.partial(applyFacade, fn, object)
    });
}

/**
 * If any of the arguments are functions, replace them with a bound version
 * before calling fn.
 * @this context that optional function arguments should be bound to
 * @param fn a function that might take other functions as arguments
 * @param context that fn should be called with
 */
function applyFacade(fn, context /* arguments */) {
    var args = _.toArray(arguments).slice(2);
    return fn.apply(context, _.map(args, facadeFunction, this));
}

/**
 * Binds the given function to this context or returns the arguments if not a
 * function. This function will return the same result for repeated calls.
 * @this context to bind the function to
 * @param fn a function to bind
 */
function facadeFunction(fn) {
    if (!_.isFunction(fn)) return fn;
    if (!_.isArray(fn._bind_facade_noflo_access)) {
        fn._bind_facade_noflo_access = [];
    }
    var idx = fn._bind_facade_noflo_access.indexOf(this);
    if (idx >= 0) return fn._bind_facade_noflo_access[idx + 1];
    fn._bind_facade_noflo_access.push(this, fn.bind(this));
    return _.last(fn._bind_facade_noflo_access);
}

/**
 * Tests if the given object is a noflo.InPort
 * @param port a noflo.InPort if the result is true
 */
function isInPort(port) {
    return port instanceof noflo.InPort;
}

/**
 * Tests if the given object is a noflo.OutPort
 * @param port a noflo.OutPort if the result is true
 */
function isOutPort(port) {
    return port instanceof noflo.OutPort;
}
