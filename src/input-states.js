// input-states.js

var _ = require('underscore');

/**
 * Getter and Setter for InPort states.
 *
 * @this is not used
 * @param node a node facade
 * @param vnid an identifier that distinguishes the set of VNI states
 * @param portName name of the input port whose state is being recorded
 * @param socketId index of the socket or undefined
 * @param state a State object containing both a data payload and an lm.
 *
 * @return getter returns the current input port state state.
 *         setter returns the current context
 *
 * Usage to retrieve state:
 *  inputState(node, vnid) : {portName: currentState, multiPortName: [currentState]}
 *  inputState(node, vnid, portName, socketId) : currentState
 * Usage to store state:
 *  inputState(node, vnid, {portName: currentState, multiPortName: [currentState]}) : this
 *  inputState(node, vnid, portName, socketId, state) : this
 */ 
module.exports = function(node, vnid, portName, socketId, state) {
    if (!node.inPorts || !node.outPorts)
        throw Error("This isn't a Component node");
    else if (!_.isString(vnid))
        throw Error("Invalid vnid: " + vnid);
    else if (_.isString(portName) && !node.inPorts[portName])
        throw Error("Invalid portName: " + portName);
    else if (arguments.length > 4)
        return setPortStateBySocketId(node, vnid, portName, socketId, state);
    else if (_.isString(portName))
        return getPortStateBySocketId(node, vnid, portName, socketId);
    else if (_.isObject(arguments[2]))
        return setAllPortStates(node, vnid, arguments[2]);
    else
        return getAllPortStates(node, vnid);
}

/**
 * Returns a hash of port names to port states or array of states if the port is
 * addressable/multi. This provides the caller with all portNames, distingishes between
 * addressable/multi and non-addressable/multi ports, and provides the caller with all their
 * states that will be useful when calling an updater.
 * @param node a node facade
 * @param vnid an identifier that distinguishes the set of VNI states
 */
function getAllPortStates(node, vnid) {
    return _.mapObject(node.inPorts, function(port, portName){
        return getPortState(node, vnid, portName);
    });
}

/**
 * Returns the state of the port or an array of states, if the port is
 * addressable/multi. When all the port states are not need this is a convient way to
 * retrieve just the port state that is needed.
 * @param node a node facade
 * @param vnid an identifier that distinguishes the set of VNI states
 * @param portName the InPort name on this node 
 */
function getPortState(node, vnid, portName) {
    var port = node.inPorts[portName];
    if (port.isMulti())
        return getPortStateArray(node, vnid, portName);
    else if (vniStateExists(node, vnid, portName))
        return node.vnis[vnid].inputStates[portName];
    else if (vnid) // By default states that come in on vnid '' apply to all
        return getPortState(node, '', portName);
    else
        return undefined;
}

/**
 * Returns an array of the port states, one item for each attached socket. When
 * all the port states are not need this is a convient way to
 * retrieve just the port state that is needed.
 * @param node a node facade
 * @param vnid an identifier that distinguishes the set of VNI states
 * @param portName the InPort name on this node 
 */
function getPortStateArray(node, vnid, portName) {
    var port = node.inPorts[portName];
    if (!port.isMulti()) throw Error("This port is not addressable/multi: " + portName);
    else return port.listAttached().map(function(socketId){
        return getPortStateBySocketId(node, vnid, portName, socketId);
    });
}

/**
 * Returns the state of this port for the given socketId. This can be used to
 * look up the last state when checking to see if the state has changed.
 * Note that the socketId is not neccessarily the same as the array index
 * @param node a node facade
 * @param vnid an identifier that distinguishes the set of VNI states
 * @param portName the name of the addressable/multi port for this node
 * @param socketId the socketId provided to a port data event
 */
function getPortStateBySocketId(node, vnid, portName, socketId) {
    if (socketId == null)
        return getPortState(node, vnid, portName);
    else if (!node.inPorts[portName].isMulti())
        throw Error("This port is not addressable/multi: " + portName);
    else if (vniStateExists(node, vnid, portName) &&
            node.vnis[vnid].inputStates[portName][socketId])
        return node.vnis[vnid].inputStates[portName][socketId];
    // By default states that come in on vnid '' apply to all VNIs
    else if (vnid)
        return getPortStateBySocketId(node, '', portName, socketId);
    else
        return undefined;
}

/**
 * Changes the state of each given port. If a port name is missing it is unmodified.
 * This can be run in a test environment to reset the state of the ports.
 * @param node a node facade
 * @param vnid an identifier that distinguishes the set of VNI states
 * @param portStates hash of portName to state
 */
function setAllPortStates(node, vnid, portStates) {
    _.each(portStates, function(state, portName) {
        setPortState(node, vnid, portName, state);
    });
    return node;
}

/**
 * Changes the state of a port. When a new state is received on a port this
 * should be called.
 * Used as a helper for setPortStateBySocketId and for testing. Normally at
 * runtime setPortStateBySocketId would be used to set the state of a port.
 * @param node a node facade
 * @param vnid an identifier that distinguishes the set of VNI states
 * @param portName name of the port on this node
 * @param state the new state (or array of states if the port is multi/addressable) to assign to this port
 */
function setPortState(node, vnid, portName, state) {
    var port = node.inPorts[portName];
    if (_.isUndefined(state)) {
        if (vniStateExists(node, vnid, portName)) {
            delete node.vnis[vnid].inputStates[portName];
            if (_.isEmpty(node.vnis[vnid].inputStates)) {
                delete node.vnis[vnid].inputStates;
            }
        }
    } else if (port.isMulti()) {
        return setPortStateArray(node, vnid, portName, state);
    } else {
        if (!vniStateExists(node, vnid, portName)) {
            node.vnis[vnid].inputStates = node.vnis[vnid].inputStates || {};
        }
        node.vnis[vnid].inputStates[portName] = state;
    }
    return node;
}

/**
 * Changes the states of a port.
 * This can be run in a test environment to reset the state of the port.
 * @param node a node facade
 * @param vnid an identifier that distinguishes the set of VNI states
 * @param portName name of the port on this node
 * @param stateArray a list of states for every attached socket on this port
 */
function setPortStateArray(node, vnid, portName, stateArray) {
    var port = node.inPorts[portName];
    if (!port.isMulti())
        throw Error("This port is not addressable/multi: " + portName);
    port.listAttached().forEach(function(socketId, i) {
        setPortStateBySocketId(node, vnid, portName, socketId, stateArray[i]);
    }, []);
    return node;
}

/**
 * Changes the state of a addressable/multi port socket. When a new state is received
 * on a port this should be called.
 * setPortState should be called instead if the port is non-multi (non-addressable).
 * @param node a node facade
 * @param vnid an identifier that distinguishes the set of VNI states
 * @param portName name of the port on this node
 * @param socketId the socketId pass to the data event handler
 * @param state the new state of this port socket
 */
function setPortStateBySocketId(node, vnid, portName, socketId, state) {
    if (socketId == null)
        return setPortState(node, vnid, portName, state);
    else if (!node.inPorts[portName].isMulti())
        throw Error("This port is not addressable/multi: " + portName);
    else if (_.isUndefined(state)) {
        if (vniStateExists(node, vnid, portName)) {
            node.vnis[vnid].inputStates[portName][socketId] = state;
            if (!_.compact(node.vnis[vnid].inputStates[portName]).length) {
                delete node.vnis[vnid].inputStates[portName];
                if (_.isEmpty(node.vnis[vnid].inputStates)) {
                    delete node.vnis[vnid].inputStates;
                }
            }
        }
    } else {
        if (!vniStateExists(node, vnid, portName)) {
            node.vnis[vnid].inputStates = node.vnis[vnid].inputStates || {};
            node.vnis[vnid].inputStates[portName] = node.vnis[vnid].inputStates[portName] || [];
        }
        node.vnis[vnid].inputStates[portName][socketId] = state;
    }
    return node;
}

/**
 * Checks if a state already exists for this vnid and portName
 * @param node a node facade
 * @param vnid an identifier that distinguishes the set of VNI states
 * @param portName name of the port on this node
 */
function vniStateExists(node, vnid, portName) {
    return node.vnis && node.vnis[vnid] &&
        node.vnis[vnid].inputStates &&
        node.vnis[vnid].inputStates[portName];
}
