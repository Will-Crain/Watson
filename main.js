'use strict'

require('require')

module.exports.loop = function() {
    
    if (!_.has(Memory, 'Blueprints')) {
        Memory.Blueprints = {Bunker: JSON.parse(Bunker)}
    }
    
    for (let i in Game.rooms) {
        
        if (_.isUndefined(Game.rooms[i].controller) || !Game.rooms[i].controller.my) {
            continue
        }
        Game.rooms[i].invokeState()
        
        if (Game.rooms[i].memory.conLevel !== undefined) {
            RoomVisual.showRoom(Game.rooms[i])
        }
        if (Game.rooms[i].memory.roomGrid) {
            RoomVisual.drawRoomGrid(Game.rooms[i].memory.roomGrid, i)
        }
        if (!_.isUndefined(Memory.toDisplay)) {
            RoomVisual.drawGrid(Memory.toDisplay, 'sim')
        }
    }
    
    for (let i in Game.creeps) {
        try {
            Game.creeps[i].memory.recursionCount = 0
            Game.creeps[i].invokeState()
        }
        catch(e) {
            console.log(`${e.name}\n${e.message}\n${e.stack}`)
        }
    }
    
}