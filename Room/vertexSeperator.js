const UNWALKABLE =   0
const OPEN =         10
const PROTECTED =    20
const TO_EXIT =      30
const EXIT =         40

Room.prototype.generateGraph = function(bounds = {x0: 0, y0: 0, x1: 49, y1: 49}) {
    let roomArray = Array(50)
    let roomTerrain = new Room.Terrain(this.name)

    let x0 = 0
    let y0 = 0
    let x1 = 49
    let y1 = 49
    // let {x0, y0, x1, y1} = bounds

    for (let i = 0; i < 49; i++) {
        roomArray[i] = []

        for (let j = 0; j < 49; j++) {
            if (roomTerrain.get(i, j) == TERRAIN_MASK_WALL) {
                roomArray[i][j] = 0
            }
            else {
                roomArray[i][j] = 1
            }
        }
    }

    return roomArray
}

Room.prototype.getExitSeparator = function(roomArray = this.generateGraph()) {
    // Flood fill to find exit separator

    let newArray =  roomArray
    let exits =     this.find(FIND_EXIT)
    let terrain =   new Room.Terrain(this.name)

    for (let i = 0; i < 49; i++) {
        for (let j = 0; j < 49; j++) {
            if (terrain.get(i, j) == TERRAIN_MASK_WALL) {
                continue
            }

            let objPos = new RoomPosition(i, j, this.name)
            if (objPos.isOnEdge()) {
                continue
            }
            let maxDist = 0
            for (let i in exits) {
                let dist = this.findPath(objPos, exits[i], {swampCost: 1, maxRooms: 1})
                if (dist.length > maxDist) {
                    maxDist = dist.length
                }
            }

            newArray[objPos.x][objPos.y] = maxDist
        }
    }

    Memory.testSeparator = newArray
    return newArray
}

Room.prototype.displaySeparator = function(roomArray) {
    let RV = new RoomVisual(this.name)
    let terrain = new Room.Terrain(this.name)

    for (let i in roomArray) {
        for (let j in roomArray[i]) {
            if (terrain.get(i, j) == 1) {
                continue
            }
            let colorMax = 0.5
            let colorMin = 0

            let maxValue = 49
            let minValue = 25
    
            let h = ( ((roomArray[i][j])-minValue)/maxValue) * ( (colorMax - colorMin) + colorMin)
            let s = 1
            let l = 0.6
            let hexColor = HSL_TO_HEX(h, s, l)
            RV.rect(i-0.5, j-0.5, 1, 1, {fill: hexColor, opacity: 0.5})
        }
    }
}