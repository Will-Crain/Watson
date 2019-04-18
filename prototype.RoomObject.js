'use strict'

RoomObject.prototype.invokeState = function() {
    if (!this.memory.stack || !this.memory.stack.length) {
        return false
    }
    
    let [[state, scope]] = this.memory.stack
    
    let method = `run${state}`
    
    if (!this[method]) {
        return false
    }
    
    this[method](scope)
    return true
}

RoomObject.prototype.getState = function(defaultState = "Idle") {
    if (!this.memory.stack) {
        return defaultState
    }
    
    return this.memory.stack[0][0] || defaultState
}

RoomObject.prototype.setState = function(state, scope={}) {
    if (!this.memory.stack) {
        this.memory.stack = []
    }
    
    let method = `run${state}`
    
    if (!this[method]) {
        throw new Error(`Failure to add ${method} to ${this}, No such state`)
    }
    
    this.memory.stack[0] = [state, scope]
    return state
}

RoomObject.prototype.pushState = function(state, scope={}, unique = false, runNext = true) {
    if (!this.memory.stack) {
        this.memory.stack = []
    }
    
    let method = `run${state}`
    
    if (!this[method]) {
        throw new Error(`Failure to add ${method} to ${this}, No such state`)
    }
    if (this.memory.stack.length >= MAX_STACK_LENGTH) {
        throw new Error(`Failure to add ${method} to ${this}, Stack too large`)
    }
    
    for (let i in this.memory.stack) {
        if (state == this.memory.stack[i][0]) {
            if (this.memory.stack[i][1].unique) {
                return false
            }
        }
    }
    
    this.memory.stack.unshift([state, scope])
    
    if (runNext) {
        this.invokeState()
    }
    return state
}

RoomObject.prototype.skipState = function() {
    if (!this.memory.stack || !this.memory.stack.length) {
        return false
    }
    
    if (this.memory.stack.length >= 2) {
        let tempStore = this.memory.stack[1]
        this.memory.stack[1] = this.memory.stack[0]
        this.memory.stack[0] = tempStore
    }
    this.pushState('Wait', {until: Game.time+1})
}

RoomObject.prototype.popState = function(runNext = false) {
    if (!this.memory.stack || !this.memory.stack.length) {
        return false
    }
    
    let [state] = this.memory.stack.shift()
    if (!this.memory.stack.length) {
        this.memory.stack = undefined
    }
    
    if (runNext) {
        this.invokeState()
    }
}

RoomObject.prototype.clearStack = function() {
    this.memory.stack = [[]]
}

RoomObject.prototype.runWait = function(scope) {
    let {until} = scope
    
    if (Game.time >= until) {
        this.popState()
    }
}
