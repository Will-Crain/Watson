const UNWALKABLE =  -1
const OPEN =         0
const PROTECTED =    1
const TO_EXIT =      2
const EXIT =         3

global.DIRECTIONS = {
    1: [0, -1],
    2: [1, -1],
    3: [1, 0],
    4: [1, 1],
    5: [0, 1],
    6: [-1, 1],
    7: [-1, 0],
    8: [-1, -1]
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
RoomPosition.prototype.isExit = function() {
    if (this.x == 49 || this.x == 0 || this.y == 49 || this.y == 0) {
        let terrain = Game.map.getRoomTerrain(this.roomName)
        if (terrain.get(this.x, this.y) != 1) {
            return true
        }
    }

    return false
}
RoomPosition.prototype.add = function(x, y) {
    if (this.x+x > 49 || this.y+y > 49 || this.x+x < 0 || this.y+y < 0) {
        return this
    }
    return new RoomPosition(this.x+x, this.y+y, this.roomName)
}
RoomPosition.prototype.getAdjacent = function() {
    let tRoom = Game.rooms[this.roomName]
    
    let terrain = tRoom.getTerrain()
    let outArr = []
    
    for (let i in DIRECTIONS) {
        let [dx, dy] = DIRECTIONS[i]
        
        let terr = terrain.get(this.x+dx, this.y+dy)
        if (terr !== 1) {
            outArr.push(this.add(dx, dy))
        }
        
    }
    
    return outArr
}


Room.prototype.generateGraph = function(bounds = {x0: 0, y0: 0, x1: 49, y1: 49}) {
    let roomArray = Array(50).fill(0)
    let roomTerrain = new Room.Terrain(this.name)

    let {x0, y0, x1, y1} = bounds

    for (let i = x0; i <= x1; i++) {
        for (let j = y0; y <= y1; y++) {
            let targetPosition = new RoomPosition(i, j, this.name)

            if (targetPosition.isExit()) {
                roomArray[i][j] = EXIT
            }
            else if (targetPosition.isNearExit()) {
                roomArray[i][j] = TO_EXIT
            }
            else if (roomTerrain.get(i, j) !== 'wall') {
                roomArray[i][j] = OPEN
            }
            else {
                roomArray[i][j] = UNWALKABLE
            }
        }
    }

    return roomArray    
}

Room.prototype.whatever = function(vertices) {
    this.vertices = vertices
    this.level = Array(vertices)

    // Creates empty edges for each vertex
    this.edges = Array(vertices).fill(0).map(x => [])

    this.newEdge = function(u, v, c) {
        // Create edge from u to v
        this.edges[u].push({v: v, r: this.edges[v].length, c: c, f: 0})

        // Create edge from v to u
        this.edges[v].push({v: u, r: this.edges[u].length - 1, c: 0, f: 0})
    }
    this.getLevel = function(s, t) {
        if (t >= this.vertices) {
            return false
        }

        this.level.fill(-1)
        this.level[s] = 0

        let q = [s]
        let u = 0
        let edge

        while (q.length) {
            u = q.splice(0, 1)[0]
            for (let i = 0; i < this.edges[u].length; i++) {
                edge = this.edges[u][i]
                if (this.level[edge.v] < 0 && edge.f < edge.c) {
                    this.level[edge.v] = this.level[u] + 1
                    q.push(edge.v)
                }
            }
        }

        return this.level[t] >= 0
    }
    // u is vertex, f is flow on path, t is sink, c is count of edges
    this.sendFlow = function(u, f, t, c) {
        if (u === t) {
            return f
        }
        let edge
        let sumFlow = 0
        let flowT = 0
        while (c[u] < this.edges[u].length) {
            edge = this.edges[u][c[u]]
            if (this.level[edge.v] === this.level[u] + 1 && edge.f < edge.c) {
                sumFlow = Math.min(f, edge.c-edge.f)
                flowT = this.sendFlow(edge.v, sumFlow, t, c)
                if (flowT > 0) {
                    edge.f += flowT
                    this.edges[edge.v][edge.r].f -= flowT
                    return flowT
                }
            }
            c[u] ++ 
        }
        return 0
    }
    this.cut = function(s) {
        let eCut = []
        this.level.fill(-1)
        this.level[s] = 1
        let q = [s]
        let u = 0
        let edge
        while (q.length) {
            u = q.splice(0, 1)[0]
            for (let i = 0; i < this.edges[u].length; i++) {
                edge = this.edges[u][i]
                if (edge.f < edge.c) {
                    if (this.level[edge.v] < 1) {
                        this.level[edge.v] = 1
                        q.push(edge.v)
                    }
                }
                if (edge.f === edge.c && edge.c > 0) {
                    edge.u = u
                    eCut.push(edge)
                }
            }
        }
        let minCut = []
        for (let i = 0; i < eCut.length; i++) {
            if (this.level[eCut[i].v] == -1) {
                minCut.push(eCut[i].u)
            }
            return minCut
        }
    }
    // Dinic algorithm
    this.minCut = function(s, t) {
        if (s == t) {
            return -1
        }
        let returnValue = 0
        let count = []
        let flow = 0
        while (this.getLevel(s, t) === true) {
            count = Array(this.v+1).fill(0)
            flow = this.sendFlow(s, Number.MAX_VALUE, t, count)
            while (flow) {
                flow = this.sendFlow(s, Number.MAX_VALUE, t, count)
                if (flow > 0) {
                    returnValue += flow
                }
            }
        }
        return returnValue
    }
}

let minCutParams = {
    createGraph: function(roomName, rect, bounds) {
        
    }
}