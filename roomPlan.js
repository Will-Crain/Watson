'use strict'

Room.prototype.generateMatrix = function(bunker = false) {
    // bunker should be bunker position

    let grid = new RoomGrid(50, 50)
    let terrain = this.getTerrain()

    let bunkerPos = []

    if (bunker !== false) {
        let posObj = RoomPosition.parse(bunker)
        for (let i in Memory.Blueprints.Bunker) {
            for (let v in Memory.Blueprints.Bunker[i]) {
                if (Memory.Blueprints.Bunker[i][v] == STRUCTURE_ROAD) {
                    continue
                }
                let dx = Number(i.substr(0, 3))
                let dy = Number(i.substr(3, 3))
                
                grid.set(posObj.x+dx, posObj.y+dy, 1)

            }
        }
    }
    
    for (let i in blueprint[level]) {
        let dx = Number(i.substr(0, 3))
        let dy = Number(i.substr(3, 3))
        let newPos = posObj.add(dx, dy)
        this.addStructure(RoomPosition.serialize(newPos), blueprint[level][i])
    }

    for (let v = 0; v <= 49; v++) {
        for (let i = 0; i <= 49; i++) {
            let newPos = new RoomPosition(i, v, this.name)

            if (newPos.isOnEdge() || newPos.isNearExit()) {
                grid.set(i, v, 0)
                continue
            }

            if (terrain.get(i, v) == 1) {
                grid.set(i, v, 1)
            }
        }
    }

    this.memory.roomGrid = grid.data
    return grid
}

Room.prototype.placeBunker = function(size = 7) {

    let terrain = this.getTerrain()

    let grid = new Grid(50, 50)
    let toAvoid = {
        1: [..._.map(this.find(FIND_SOURCES), s => s.pos), ..._.map(this.find(FIND_MINERALS), s => s.pos)],
        2: [this.controller.pos]
    }

    for (let v = 0; v <= 49; v++) {
        for (let i = 0; i <= 49; i++) {
            let newPos = new RoomPosition(i, v, this.name)

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