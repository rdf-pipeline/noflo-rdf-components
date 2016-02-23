// input-states.js

var _ = require('underscore');

/**
 * Getter and Setter for InPort states.
 *
 * @param component a component facade
 * @param vnid an identifier that distinguishes the set of states
 * @param inportName name of the input port whose state is being recorded
 * @param socketIndex (optional) index of the socket
 * @param sourceNodeName (optional) name of the node that sent the new state data
 * @param sourcePortName (optional) name of the the source node port that sent the state data.
 * @param newState a State object containing both a data payload and an lm.
 *
 * @return getter returns the current input port state state.
 *         setter returns the current context
 *
 * Usage to retrieve state:
 *  inputState(component, vnid) : {portName: currentState, addressablePortName: [currentState]}
 *  inputState(component, vnid, portName) : currentState
 *  TODO inputState(component, vnid, addressablePortName) : [currentState]
 *  TODO inputState(component, vnid, addressablePortName, socketIndex) : currentState
 *  TODO inputState(component, vnid, addressablePortName, sourceNodeName, sourcePortName) : currentState
 * Usage to store state:
 *  inputState(component, vnid, {portName: currentState, addressablePortName: [currentState]}) : this
 *  inputState(component, vnid, portName, state) : this
 *  TODO inputState(component, vnid, addressablePortName, [state]) : this
 *  TODO inputState(component, vnid, addressablePortName, socketIndex, state) : this
 *  TODO inputState(component, vnid, addressablePortName, sourceNodeName, sourcePortName, state) : this
 */ 
module.exports = function(component, vnid, inportName, sourceNodeName, sourcePortName, newState) {
    if (!component.inPorts || !component.outPorts) throw Error("This isn't a Component");
    else if (!_.isString(vnid)) throw Error("Invalid vnid: " + vnid);
    else if (_.isString(inportName) && !component.inPorts[inportName])
        throw Error("Invalid port name: " + inportName);
    var delegate = chooseForm(arguments);
    return delegate.apply(this, arguments);
}

/**
 * Higher level function to choose which dispatch function should be called.
 * @param component a component facade
 * @param args the arguments to inputState function call
 */
function chooseForm(args){
    var string = _.isString(args[2]);
    var addressable = string && args[0].inPorts[args[2]].isMulti();
    var finite = _.isFinite(args[3]);
    var array = _.isArray(args[3]);
    switch (args.length) {
        case 2: return getAllPortStates;
        case 3: return addressable ? getPortStateArray :
            string ? getPortState : setAllPortStates;
        case 4: return array ? setPortStateArray :
            finite ? getPortStateIndex : setPortState;
        case 5: return finite ? setPortStateIndex : getPortStateEntry;
        case 6: return setPortStateEntry;
        default: throw Error("Unknown set of " + args.length + " args");
    }
}

/**
 * Returns a hash of port names to port states or array of states if the port is
 * addressable/multi. This provides the caller with all portNames, distingishes between
 * addressable/multi and non-addressable/multi ports, and provides the caller with all their
 * states that will be useful when calling an updater.
 * @param component a component facade
 * @param vnid an identifier that distinguishes the set of states
 */
function getAllPortStates(component, vnid) {
    var inPorts = _.pick(component.inPorts, isPort);
    return _.mapObject(inPorts, function(port, portName){
        return getPortState(component, vnid, portName);
    });
}

/**
 * Returns the state of the port or an array of states, if the port is
 * addressable/multi. When all the port states are not need this is a convient way to
 * retrieve just the port state that is needed.
 * @param component a component facade
 * @param vnid an identifier that distinguishes the set of states
 * @param portName the InPort name on this component 
 */
function getPortState(component, vnid, portName) {
    var port = component.inPorts[portName];
    if (port.isMulti()) return getPortStateArray(component, vnid, portName);
    else if (component.vnis && component.vnis[vnid] && component.vnis[vnid][portName])
        return component.vnis[vnid][portName];
    else if (vnid) return getPortState(component, '', portName);
    else return undefined;
}

/**
 * Returns an array of the port states, one item for each attached socket. When
 * all the port states are not need this is a convient way to
 * retrieve just the port state that is needed.
 * @param component a component facade
 * @param vnid an identifier that distinguishes the set of states
 * @param portName the InPort name on this component 
 */
function getPortStateArray(component, vnid, portName) {
    var port = component.inPorts[portName];
    var state = component.vnis && component.vnis[vnid] && component.vnis[vnid][portName];
    if (!isMultiPort(port)) throw Error("This port is not addressable/multi: " + portName);
    else if (!_.isArray(state)) return [];
    else return port.listAttached().map(function(socketIndex){
        return getPortStateIndex(component, vnid, portName, socketIndex);
    });
}

/**
 * Returns the state of this port for an identified socket. This can be used to
 * look up the last state when checking to see if the state has changed.
 * @param component a component facade
 * @param vnid an identifier that distinguishes the set of states
 * @param portName the name of the addressable/multi port for this component
 * @param sourceNode the upstream component nodeId
 * @param sourcePort the upstream component port name
 */
function getPortStateEntry(component, vnid, portName, sourceNode, sourcePort) {
    if (!isMultiPort(component.inPorts[portName]))
        throw Error("This port is not addressable/multi: " + portName);
    var socketIndex = findSocketIndex(component, portName, sourceNode, sourcePort);
    return getPortStateIndex(component, vnid, portName, socketIndex);
}

/**
 * Returns the state of this port for the given socketIndex. This can be used to
 * look up the last state when checking to see if the state has changed.
 * Note that the socketIndex is not neccessarily the same as the array index
 * @param component a component facade
 * @param vnid an identifier that distinguishes the set of states
 * @param portName the name of the addressable/multi port for this component
 * @param socketIndex the socketIndex (or socketId) provided to a port data event
 */
function getPortStateIndex(component, vnid, portName, socketIndex) {
    if (!isMultiPort(component.inPorts[portName]))
        throw Error("This port is not addressable/multi: " + portName);
    component.vnis = component.vnis || {};
    component.vnis[vnid] = component.vnis[vnid] || {};
    component.vnis[vnid][portName] = component.vnis[vnid][portName] || [];
    if (component.vnis[vnid][portName].length)
        return component.vnis[vnid][portName][socketIndex];
    else if (vnid) return getPortStateIndex(component, '', portName, socketIndex);
    else return undefined;
}

/**
 * Changes the state of each given port. If a port name is missing it is unmodified.
 * This can be run in a test environment to reset the state of the ports.
 * @param component a component facade
 * @param vnid an identifier that distinguishes the set of states
 * @param portStates hash of portName to state
 */
function setAllPortStates(component, vnid, portStates) {
    _.each(portStates, function(state, portName) {
        setPortState(component, vnid, portName, state);
    });
    return component;
}

/**
 * Changes the state of a port. When a new state is received on a port this
 * should be called.
 * @param component a component facade
 * @param vnid an identifier that distinguishes the set of states
 * @param portName name of the port on this component
 * @param state the new state to assign this port to
 */
function setPortState(component, vnid, portName, state) {
    var port = component.inPorts[portName];
    if (_.isUndefined(state)) {
        if (component.vnis && component.vnis[vnid]) {
            delete component.vnis[vnid][portName];
            if (_.isEmpty(component.vnis[vnid])) {
                delete component.vnis[vnid];
            }
        }
    } else if (port.isMulti()) {
        return setPortStateArray(component, vnid, portName, state);
    } else {
        component.vnis = component.vnis || {};
        component.vnis[vnid] = component.vnis[vnid] || {};
        component.vnis[vnid][portName] = state;
    }
    return component;
}

/**
 * Changes the states of a port.
 * @param component a component facade
 * @param vnid an identifier that distinguishes the set of states
 * @param portName name of the port on this component
 * @param stateArray a list of states for every attached socket on this port
 */
function setPortStateArray(component, vnid, portName, stateArray) {
    var port = component.inPorts[portName];
    if (!isMultiPort(port))
        throw Error("This port is not addressable/multi: " + portName);
    port.listAttached().forEach(function(socketIndex, i) {
        setPortStateIndex(component, vnid, portName, socketIndex, stateArray[i]);
    }, []);
    return component;
}

/**
 * Changes the state of a addressable/multi port socket. This is useful for testing
 * as it looks up the socketIndex from the upstream component name and port.
 * @param component a component facade
 * @param vnid an identifier that distinguishes the set of states
 * @param portName name of the port on this component
 * @param sourceNode the upstream component name
 * @param sourcePort the upstream component port name attached to this port
 * @param state the new state of this port socket
 */
function setPortStateEntry(component, vnid, portName, sourceNode, sourcePort, state) {
    if (!isMultiPort(component.inPorts[portName]))
        throw Error("This port is not addressable/multi: " + portName);
    var socketIndex = findSocketIndex(component, portName, sourceNode, sourcePort);
    return setPortStateIndex(component, vnid, portName, socketIndex, state);
}

/**
 * Changes the state of a addressable/multi port socket. When a new state is received
 * on a port this should be called.
 * @param component a component facade
 * @param vnid an identifier that distinguishes the set of states
 * @param portName name of the port on this component
 * @param socketIndex the socketIndex (or socketId) pass to the data event handler
 * @param state the new state of this port socket
 */
function setPortStateIndex(component, vnid, portName, socketIndex, state) {
    if (!isMultiPort(component.inPorts[portName]))
        throw Error("This port is not addressable/multi: " + portName);
    component.vnis = component.vnis || {};
    component.vnis[vnid] = component.vnis[vnid] || {};
    component.vnis[vnid][portName] = component.vnis[vnid][portName] || [];
    component.vnis[vnid][portName][socketIndex] = state;
    if (_.isUndefined(state) && !_.compact(component.vnis[vnid][portName]).length) {
        delete component.vnis[vnid][portName];
        if (_.isEmpty(component.vnis[vnid])) {
            delete component.vnis[vnid];
        }
    }
    return component;
}

/**
 * Checks that the given object is an addressable/multi port. This is used to validate
 * that a given portName is actually addressable/multi to fail fast otherwise.
 * @param component a component facade
 * @param port a port facade.
 */
function isMultiPort(port) {
    return isPort(port) && port.isMulti();
}

/**
 * Checks that the given object is a port or a port facade. Noflo does not provide
 * a list of available port in a component and this allows the caller to remove
 * other properties and functions that are on the inPorts objects.
 * @param port a port facade.
 */
function isPort(port) {
    return _.isFunction(port.isMulti);
}

/**
 * Given the source Component node name and source OutPort name, returns the
 * socketIndex (aka socketId) of the addressable/multi InPort with the name portName.
 * This maps the sourceNode/sourcePort to socketIndex to allow either form to be
 * used in a seamless way.
 * @param component a component facade
 * @param portName the addressable/multi InPort of this component
 * @param sourceNode the node name of the upstream component
 * @param sourcePort the OutPort name of the upstream component's port
 */
function findSocketIndex(component, portName, sourceNode, sourcePort) {
    var port = component.inPorts[portName];
    var socketIndex = _.find(port.listAttached(), function(socketIndex) {
        return port.getComponentPortNameOn(socketIndex) == sourcePort &&
            port.getComponentIdOn(socketIndex) == sourceNode;
    });
    if (socketIndex < 0 || socketIndex == null)
        throw Error("No attached socket for " + sourceNode + "." + sourcePort);
    return socketIndex;
}
