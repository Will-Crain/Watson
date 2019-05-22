'use strict'

require('require')

module.exports.loop = function() {
    let orders = false
    if (Game.cpu.bucket > 1e3) {
        let orders = Game.market.getAllOrders()
    }

    if (!_.has(Memory, 'Blueprints')) {
        Memory.Blueprints = {Bunker: JSON.parse(Bunker)}
    }
    
    for (let i in Game.rooms) {
        
        if (_.isUndefined(Game.rooms[i].controller) || !Game.rooms[i].controller.my) {
            continue
        }
        
        // for (let v in Game.rooms[i].memory.Creeps) {
        //     if (Game.rooms[i].memory.Creeps[v]) {
        //         if (Game.rooms[i].memory.Creeps[v].role == 'MINERAL_HAULER' || Game.rooms[i].memory.Creeps[v].role == 'MINERAL_MINER') {
        //             Game.rooms[i].memory.Creeps[v] = undefined
        //         }
        //     }
        // }
        
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
    
    
    
    if (_.isUndefined(Memory.cpuUsage)) {
        Memory.cpuUsage = []
    }
    
    if (Memory.cpuUsage.length > 1000) {
        Memory.cpuUsage.pop()
    }
    
    Memory.cpuUsage.unshift(Game.cpu.getUsed())

}