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

RoomObject.prototype.pushState = function(state, scope={}) {
    if (!this.memory.stack) {
        this.memory.stack = []
    }
    if (!_.isUndefined(this.memory) && !this.memory.recursionCount) {
        this.memory.recursionCount = 0
    }

    let runNext = false
    if (this.memory.recursionCount < RECURSION_DEPTH) {
        runNext = true
    }
    
    let method = `run${state}`
    
    if (!this[method]) {
        throw new Error(`Failure to add ${method} to ${this}, No such state`)
    }
    if (this.memory.stack.length >= MAX_STACK_LENGTH) {
        throw new Error(`Failure to add ${method} to ${this}, Stack too large`)
    }
    
    this.memory.stack.unshift([state, scope])
    
    if (runNext) {
        this.memory.recursionCount++
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

RoomObject.prototype.popState = function() {
    if (!this.memory.stack || !this.memory.stack.length) {
        return false
    }
    if (!_.isUndefined(this.memory) && !this.memory.recursionCount) {
        this.memory.recursionCount = 0
    }
    

    let runNext = false
    if (this.memory.recursionCount < RECURSION_DEPTH) {
        runNext = true
    }
    
    let [state] = this.memory.stack.shift()
    if (!this.memory.stack.length) {
        this.memory.stack = [[]]
    }
    
    if (runNext) {
        this.memory.recursionCount++
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

//      //      //      //      //      //      //      //      //

//      //      //      //      //      //      //      //      //