'use strict'

require('require')

module.exports.loop = function() {
    global.ORDERS = false
    if (Game.cpu.bucket > 1e3) {
        ORDERS = Game.market.getAllOrders()
    }
    else {
        ORDERS = false
    }

    if (!_.has(Memory, 'Blueprints')) {
        Memory.Blueprints = {Bunker: JSON.parse(Bunker)}
    }
    
    for (let i in Game.rooms) {
        
        if (_.isUndefined(Game.rooms[i].controller) || !Game.rooms[i].controller.my) {
            continue
        }
        
        if (_.isUndefined(Game.rooms[i].memory.conLevel)) {
            Game.rooms[i].setup()
        }
        
        try {
            Game.rooms[i].invokeState()
        }
        catch (e) {
            console.log(`${e.name}\n${e.message}\n${e.stack}`)
        }
        
        if (Game.rooms[i].memory.conLevel !== undefined) {
            RoomVisual.showRoom(Game.rooms[i])
        }
        if (Memory.RoomCache[i] && Memory.RoomCache[i].structures) {
            // RoomVisual.drawRoomGrid(Memory.RoomCache[i].structures, i)
        }
        if (!_.isUndefined(Memory.toDisplay)) {
            // RoomVisual.drawGrid(Memory.toDisplay.data, i)
        }
    }
    
    for (let i in Game.creeps) {
        try {
            Game.creeps[i].memory.recursionCount = 0
            Game.creeps[i].invokeState()
        }
        catch(e) {
            // Game.creeps[i].popState()
            console.log(`${e.name}\n${e.message}\n${e.stack}`)
        }
    }

    for (let i in Game.powerCreeps) {
        try {
            Game.powerCreeps[i].memory.recursionCount = 0
            Game.powerCreeps[i].invokeState()
        }
        catch(e) {
            // Game.creeps[i].popState()
            console.log(`${e.name}\n${e.message}\n${e.stack}`)
        }
    }

    if (_.isUndefined(Memory.cpuUsage)) {
        Memory.cpuUsage = []
    }
    
    if (Memory.cpuUsage.length > 1000) {
        Memory.cpuUsage.pop()
    }
    
    Memory.cpuUsage.unshift(Game.cpu.getUsed())

}