'use strict'

require('require')

module.exports.loop = function() {
    
    if (!_.has(Memory, 'Blueprints')) {
        Memory.Blueprints = {Bunker: JSON.parse(Bunker)}
    }
    
    for (let i in Game.rooms) {
        
        if (Game.rooms[i].controller && !Game.rooms[i].controller.my) {
            continue
        }
        Game.rooms[i].invokeState()
        
        if (Game.rooms[i].memory.conLevel !== undefined) {
            RoomVisual.showRoom(Game.rooms[i])
        }
    }
    
    for (let i in Game.creeps) {
        Game.creeps[i].invokeState()
    }
    
}
