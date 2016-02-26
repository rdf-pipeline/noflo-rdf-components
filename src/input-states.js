// input-states.js

var _ = require('underscore');

/**
 * Getter and Setter for InPort states.
 *
 * @param component a component facade
 * @param vnid an identifier that distinguishes the set of VNI states
 * @param inportName name of the input port whose state is being recorded
 * @param socketId (optional) index of the socket
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
 *  inputState(component, vnid, addressablePortName) : [currentState]
 *  inputState(component, vnid, addressablePortName, socketId) : currentState
 *  inputState(component, vnid, addressablePortName, sourceNodeName, sourcePortName) : currentState
 * Usage to store state:
 *  inputState(component, vnid, {portName: currentState, addressablePortName: [currentState]}) : this
 *  inputState(component, vnid, portName, state) : this
 *  inputState(component, vnid, addressablePortName, [state]) : this
 *  inputState(component, vnid, addressablePortName, socketId, state) : this
 *  inputState(component, vnid, addressablePortName, sourceNodeName, sourcePortName, state) : this
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
            finite ? getPortStateBysocketId : setPortState;
        case 5: return finite ? setPortStateBysocketId : getPortStateEntry;
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
 * @param vnid an identifier that distinguishes the set of VNI states
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
 * @param vnid an identifier that distinguishes the set of VNI states
 * @param portName the InPort name on this component 
 */
function getPortState(component, vnid, portName) {
    var port = component.inPorts[portName];
    if (port.isMulti()) return getPortStateArray(component, vnid, portName);
    else if (ensureVniStateExists(component, vnid, portName))
        return component.vnis[vnid].inputStates[portName];
    // By default states that come in on vnid '' apply to all VNIs
    else if (vnid) return getPortState(component, '', portName);
    else return undefined;
}

/**
 * Returns an array of the port states, one item for each attached socket. When
 * all the port states are not need this is a convient way to
 * retrieve just the port state that is needed.
 * @param component a component facade
 * @param vnid an identifier that distinguishes the set of VNI states
 * @param portName the InPort name on this component 
 */
function getPortStateArray(component, vnid, portName) {
    var port = component.inPorts[portName];
    if (!isMultiPort(port)) throw Error("This port is not addressable/multi: " + portName);
    else return port.listAttached().map(function(socketId){
        return getPortStateBysocketId(component, vnid, portName, socketId);
    });
}

/**
 * Returns the state of this port for an identified socket. This can be used to
 * look up the last state when checking to see if the state has changed.
 * @param component a component facade
 * @param vnid an identifier that distinguishes the set of VNI states
 * @param portName the name of the addressable/multi port for this component
 * @param sourceNode the upstream component nodeId
 * @param sourcePort the upstream component port name
 */
function getPortStateEntry(component, vnid, portName, sourceNode, sourcePort) {
    if (!isMultiPort(component.inPorts[portName]))
        throw Error("This port is not addressable/multi: " + portName);
    var socketId = findsocketId(component, portName, sourceNode, sourcePort);
    return getPortStateBysocketId(component, vnid, portName, socketId);
}

/**
 * Returns the state of this port for the given socketId. This can be used to
 * look up the last state when checking to see if the state has changed.
 * Note that the socketId is not neccessarily the same as the array index
 * @param component a component facade
 * @param vnid an identifier that distinguishes the set of VNI states
 * @param portName the name of the addressable/multi port for this component
 * @param socketId the socketId provided to a port data event
 */
function getPortStateBysocketId(component, vnid, portName, socketId) {
    if (!isMultiPort(component.inPorts[portName]))
        throw Error("This port is not addressable/multi: " + portName);
    if (ensureVniStateExists(component, vnid, portName) &&
            component.vnis[vnid].inputStates[portName][socketId])
        return component.vnis[vnid].inputStates[portName][socketId];
    // By default states that come in on vnid '' apply to all VNIs
    else if (vnid) return getPortStateBysocketId(component, '', portName, socketId);
    else return undefined;
}

/**
 * Changes the state of each given port. If a port name is missing it is unmodified.
 * This can be run in a test environment to reset the state of the ports.
 * @param component a component facade
 * @param vnid an identifier that distinguishes the set of VNI states
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
 * @param vnid an identifier that distinguishes the set of VNI states
 * @param portName name of the port on this component
 * @param state the new state (or array of states if the port is multi/addressable) to assign to this port
 */
function setPortState(component, vnid, portName, state) {
    var port = component.inPorts[portName];
    if (_.isUndefined(state)) {
        if (ensureVniStateExists(component, vnid, portName)) {
            delete component.vnis[vnid].inputStates[portName];
            if (_.isEmpty(component.vnis[vnid].inputStates)) {
                delete component.vnis[vnid].inputStates;
                if (_.isEmpty(component.vnis[vnid])) {
                    delete component.vnis[vnid];
                }
            }
        }
    } else if (port.isMulti()) {
        return setPortStateArray(component, vnid, portName, state);
    } else {
        if (!ensureVniStateExists(component, vnid, portName)) {
            component.vnis = component.vnis || {};
            component.vnis[vnid] = component.vnis[vnid] || {};
            component.vnis[vnid].inputStates = component.vnis[vnid].inputStates || {};
        }
        component.vnis[vnid].inputStates[portName] = state;
    }
    return component;
}

/**
 * Changes the states of a port.
 * @param component a component facade
 * @param vnid an identifier that distinguishes the set of VNI states
 * @param portName name of the port on this component
 * @param stateArray a list of states for every attached socket on this port
 */
function setPortStateArray(component, vnid, portName, stateArray) {
    var port = component.inPorts[portName];
    if (!isMultiPort(port))
        throw Error("This port is not addressable/multi: " + portName);
    port.listAttached().forEach(function(socketId, i) {
        setPortStateBysocketId(component, vnid, portName, socketId, stateArray[i]);
    }, []);
    return component;
}

/**
 * Changes the state of a addressable/multi port socket. This is useful for testing
 * as it looks up the socketId from the upstream component name and port.
 * @param component a component facade
 * @param vnid an identifier that distinguishes the set of VNI states
 * @param portName name of the port on this component
 * @param sourceNode the upstream component name
 * @param sourcePort the upstream component port name attached to this port
 * @param state the new state of this port socket
 */
function setPortStateEntry(component, vnid, portName, sourceNode, sourcePort, state) {
    if (!isMultiPort(component.inPorts[portName]))
        throw Error("This port is not addressable/multi: " + portName);
    var socketId = findsocketId(component, portName, sourceNode, sourcePort);
    return setPortStateBysocketId(component, vnid, portName, socketId, state);
}

/**
 * Changes the state of a addressable/multi port socket. When a new state is received
 * on a port this should be called.
 * @param component a component facade
 * @param vnid an identifier that distinguishes the set of VNI states
 * @param portName name of the port on this component
 * @param socketId the socketId pass to the data event handler
 * @param state the new state of this port socket
 */
function setPortStateBysocketId(component, vnid, portName, socketId, state) {
    if (!isMultiPort(component.inPorts[portName]))
        throw Error("This port is not addressable/multi: " + portName);
    if (_.isUndefined(state)) {
        if (ensureVniStateExists(component, vnid, portName)) {
            component.vnis[vnid].inputStates[portName][socketId] = state;
            if (!_.compact(component.vnis[vnid].inputStates[portName]).length) {
                delete component.vnis[vnid].inputStates[portName];
                if (_.isEmpty(component.vnis[vnid].inputStates)) {
                    delete component.vnis[vnid].inputStates;
                    if (_.isEmpty(component.vnis[vnid])) {
                        delete component.vnis[vnid];
                    }
                }
            }
        }
    } else {
        if (!ensureVniStateExists(component, vnid, portName)) {
            component.vnis = component.vnis || {};
            component.vnis[vnid] = component.vnis[vnid] || {};
            component.vnis[vnid].inputStates = component.vnis[vnid].inputStates || {};
            component.vnis[vnid].inputStates[portName] = component.vnis[vnid].inputStates[portName] || [];
        }
        component.vnis[vnid].inputStates[portName][socketId] = state;
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
 * socketId (aka socketId) of the addressable/multi InPort with the name portName.
 * This maps the sourceNode/sourcePort to socketId to allow either form to be
 * used in a seamless way.
 * @param component a component facade
 * @param portName the addressable/multi InPort of this component
 * @param sourceNode the node name of the upstream component
 * @param sourcePort the OutPort name of the upstream component's port
 */
function findsocketId(component, portName, sourceNode, sourcePort) {
    var port = component.inPorts[portName];
    var socketId = _.find(port.listAttached(), function(socketId) {
        return port.getSourcePortNameOn(socketId) == sourcePort &&
            port.getSourceIdOn(socketId) == sourceNode;
    });
    if (socketId < 0 || socketId == null)
        throw Error("No attached socket for " + sourceNode + "." + sourcePort);
    return socketId;
}

function ensureVniStateExists(component, vnid, portName) {
    return component.vnis && component.vnis[vnid] &&
        component.vnis[vnid].inputStates &&
        component.vnis[vnid].inputStates[portName];
}
