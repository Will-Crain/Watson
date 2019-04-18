'use strict'

Room.placeBunker = function(roomName, size = 7) {
    let tRoom = Game.rooms[roomName]
    if (_.isUndefined(tRoom)) {
        return false
    }

    let terrain = Game.map.getRoomTerrain(roomName)

    let grid = new Grid(50, 50)
    let toAvoid = {
        2: [..._.map(tRoom.find(FIND_SOURCES), s => s.pos), ..._.map(tRoom.find(FIND_MINERALS), s => s.pos)],
        3: [tRoom.controller.pos]
    }

    for (let v = 0; v <= 49; v++) {
        for (let i = 0; i <= 49; i++) {
            let newPos = new RoomPosition(i, v, roomName)

            if (newPos.isOnEdge() || newPos.isNearExit()) {
                grid.set(i, v, 0)
                continue
            }
            
            let avoided = false
            for (let r in toAvoid) {
                let nearest = newPos.findClosestByRange(toAvoid[r])
                if (newPos.getRangeTo(nearest) <= r) {
                    grid.set(i, v, 0)
                    avoided = true
                    break
                }
            }
            if (avoided == true) {
                continue
            }

            if (terrain.get(i, v) == 1) {
                grid.set(i, v, 0)
                continue
            }

            let adj = [grid.get(i-1, v), grid.get(i, v-1), grid.get(i-1, v-1)]
            grid.set(i, v, Math.min(...adj)+1)

        }
    }

    Memory.toDisplay = grid.data
    return grid.toString()

}


//      //      //      //      //      //      //      //      //      //

//      //      //      //      //      //      //      //      //      //

Room.prototype.getBuildings = function(centerPos, refPos, rng, lvl) {
  let structs = centerPos.findInRange(FIND_STRUCTURES, rng)
  Memory.Blueprints['Extension1'][lvl] = {}
  let buildings = {}
  
  for (let i in structs) {
      let dx = structs[i].pos.x - centerPos.x
      let dy = structs[i].pos.y - centerPos.y
      
      let newPos = centerPos.add(dx, dy)
      let testPos = refPos.add(dx, dy)
      let tStruct = _.find(testPos.lookFor(LOOK_STRUCTURES), s => s.structureType == structs[i].structureType)
      
      if (tStruct !== undefined) {
          continue
      }
      
      let xStr = dx.addLeadingZeros(2, true)
      let yStr = dy.addLeadingZeros(2, true)
      
      let dPosStr = xStr + yStr
      
      if (!_.has(buildings, dPosStr)) {
          buildings[dPosStr] = []
          
      }
      buildings[dPosStr].push(structs[i].structureType)
  }
  
  Memory.Blueprints.Extension1[lvl] = buildings
}
