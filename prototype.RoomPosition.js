'use strict'

RoomPosition.prototype.getAdjacent = function(checkStructures = false) {
    let tRoom = Game.rooms[this.roomName]
    
    let terrain = tRoom.getTerrain()
    let outStrArr = []
    
    for (let i in DIRECTIONS) {
        let [dx, dy] = DIRECTIONS[i]
        
        if (checkStructures == false) {
            let terr = terrain.get(this.x+dx, this.y+dy)
            if (terr !== 1) {
                outStrArr.push(RoomPosition.serialize(this.add(dx, dy)))
            }
        }
        
    }
    
    return outStrArr
}

RoomPosition.prototype.fromDirection = function(direction) {
    let [dx, dy] = DIRECTIONS[direction]
    return new RoomPosition(this.x+dx, this.y + dy, this.roomName)
}
RoomPosition.prototype.isOnEdge = function() {
    if (this.x == 49 || this.x == 0 || this.y == 49 || this.y == 0) {
        return true
    }
    return false
}
RoomPosition.prototype.isNearExit = function() {
    let adjPos = this.getAdjacent()
    let terrain = Game.map.getRoomTerrain(this.roomName)

    for (let i in adjPos) {
        let newPos = RoomPosition.parse(adjPos[i])
        if (newPos.isOnEdge() && terrain.get(newPos.x, newPos.y) != 1) {
            return true
        }
    }
    return false
}

RoomPosition.prototype.add = function(x, y) {
    if (this.x+x > 49 || this.y+y || 49 || this.x+x < 0 || this.y+y < 0) {
        return this
    }
    return new RoomPosition(this.x+x, this.y+y, this.roomName)
}

RoomPosition.serialize = function(posObj) {
    let xStr = posObj.x.addLeadingZeros(2)
    let yStr = posObj.y.addLeadingZeros(2)
    
    return xStr + yStr + posObj.roomName
}

RoomPosition.parse = function(posStr) {
    let x = Number(posStr.substring(0, 2))
    let y = Number(posStr.substring(2, 4))
    let roomName = posStr.substring(4)
    
    return new RoomPosition(x, y, roomName)
}
