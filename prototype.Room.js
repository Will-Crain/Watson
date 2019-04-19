'use strict'

Room.prototype.standardRuntime = function() {
    this.checkToSpawn()
    this.checkToBuild()
    this.spawnQueue()
    this.buildQueue()
    this.fireTowers()
    this.defend()
}

Room.prototype.runRCL1 = function(scope) {
    
    // Initial setup
    if (this.memory.conLevel < this.controller.level && this.controller.level == 1) {
        
        let spawn = _.first(this.find(FIND_STRUCTURES, {filter: s => s.structureType == STRUCTURE_SPAWN}))

        if (spawn == undefined) {
            return
        }
        
        if (this.memory.Bunker == '') {
            let bunkerPos = spawn.pos.add(0, -2)
            this.memory.Bunker = RoomPosition.serialize(bunkerPos)
        }
            
        this.addFromBlueprint(this.memory.Bunker, Memory.Blueprints.Bunker, this.controller.level)
        
        
        this.memory.eventFlags = {}
        this.memory.eventFlags[1] = {}
        this.memory.eventFlags[1]['01CONTAINER'] = false
        
        
        let spawnPos = this.find(FIND_STRUCTURES, {filter: s => s.structureType == STRUCTURE_SPAWN})[0].pos
        let controllerPos = this.controller.pos
        
        let fromSpawnToController = spawnPos.findPathTo(controllerPos, {ignoreRoads: true, maxRooms: 1, ignoreCreeps: true, ignoreDestructibleStructures: true})
        
        let {x, y} = (fromSpawnToController.reverse())[4]
        let containerPos = new RoomPosition(x, y, this.name)
        
        this.addStructure(RoomPosition.serialize(containerPos), STRUCTURE_CONTAINER, 5)
        
        let sources = this.find(FIND_SOURCES)

        for (let i in sources) {
            this.addSource(RoomPosition.serialize(sources[i].pos))
        }

        let memSources = this.memory.sources
        for (let i in memSources) {
            let posStr = i
            let posObj = RoomPosition.parse(posStr)
            let adjStr = posObj.getAdjacent()
            for (let v in adjStr) {
                this.addCreep('ENERGY_GATHERER', [['Harvest', {posStr: posStr}]])
            }
        }
        
        this.memory.conLevel = this.controller.level
    }
    
    // Container is completed
    if (this.memory.eventFlags[1]['01CONTAINER'] == false) {
        let container = _.find(this.find(FIND_STRUCTURES), s => s.structureType == STRUCTURE_CONTAINER)
        if (!_.isUndefined(container)) {
            let serPos = RoomPosition.serialize(container.pos)
            this.memory.takeFrom.unshift(serPos)
            this.memory.storeTo.push(serPos)

            this.memory.eventFlags[1]['01CONTAINER'] = true
        }
        
    }
    
    // Room levels up
    if (this.memory.conLevel < this.controller.level && this.controller.level == 2) {
        this.memory.toRCL[2] = Game.time - this.memory.toRCL[1]
        this.setState('RCL2', {})
        return
    }
    
    // Normal runtime conditions
    this.standardRuntime()
}
Room.prototype.runRCL2 = function(scope) {
    
    // Initial setup
    if (this.memory.conLevel < this.controller.level && this.controller.level == 2) {
        
        this.memory.eventFlags[2] = {}
        this.memory.eventFlags[2]['01EXTENSIONS'] = false
        
        let conPos = RoomPosition.serialize(this.controller.pos)
        
        this.addCreep('MOBILE_UPGRADER', [['Upgrade', {posStr: conPos, cont: true}]])
        this.addCreep('EXTENSIONER', [['FillExtensions', {path: false}]])
        this.addFromBlueprint(this.memory.Bunker, Memory.Blueprints.Bunker, this.controller.level)
        
        this.memory.conLevel = this.controller.level
    }
    
    // Extensions are completed
    if (this.memory.eventFlags[2]['01EXTENSIONS'] == false) {
        if (this.find(FIND_STRUCTURES, {filter: s => s.structureType == STRUCTURE_EXTENSION}).length == CONTROLLER_STRUCTURES['extension'][this.controller.level]) {
            
            let adjRooms = Game.map.describeExits(this.name)
            if (adjRooms == null) {
                this.memory.eventFlags[2]['01EXTENSIONS'] = true
            }
            for (let i in adjRooms) {
                if (Room.describe(adjRooms[i]) == 'ROOM') {
                    this.addCreep('SCOUT', [['Scout', {roomName: adjRooms[i], message: '', addSources: true}]])
                }
            }

            let toRecycle = ['ENERGY_GATHERER']
            for (let i in this.memory.Creeps) {
                if (toRecycle.includes(this.memory.Creeps[i].role)) {
                    this.memory.Creeps[i].removeOnDeath = true
                }
            }

            for (let i in this.memory.sources) {
                let standPosStr = this.memory.sources[i].container
                let minePosStr = i
                this.addCreep('ENERGY_MINER', [['Mine', {standPosStr: standPosStr, minePosStr: minePosStr}]], 3)
                this.addCreep('HAULER', [['Haul', {pickUp: standPosStr, dist: this.memory.soruces[i].pathLength, dropOff: _.first(this.memory.storeTo)}]], 5, false, this.getHaulerBody(this.memory.sources[i].pathLength))
            }

            this.memory.eventFlags[2]['01EXTENSIONS'] = true
        }
    }
    
    // Room levels up
    if (this.memory.conLevel < this.controller.level && this.controller.level == 3) {
        this.memory.toRCL[3] = Game.time - this.memory.toRCL[2]
        this.setState('RCL3', {})
        return
    }
    
    // Normal runtime conditions
    this.standardRuntime()
}
Room.prototype.runRCL3 = function(scope) {

    // Initial setup
    if (this.memory.conLevel < this.controller.level && this.controller.level == 3) {
        
        this.memory.eventFlags[3] = {}
        this.memory.eventFlags[3]['01TOWER'] = false
        this.memory.eventFlags[3]['02EXTENSIONS'] = false

        this.addCreep('BUILDER', [['FindBuild', {}]])

        this.addFromBlueprint(this.memory.Bunker, Memory.Blueprints.Bunker, this.controller.level)
        
        this.memory.conLevel = this.controller.level
    }

    // Tower is completed
    if (this.memory.eventFlags[3]['01TOWER'] == false) {
        if (this.find(FIND_STRUCTURES, {filter: s => s.structureType == STRUCTURE_TOWER}).length == CONTROLLER_STRUCTURES['tower'][this.controller.level]) {
            this.memory.eventFlags[3]['01TOWER'] = true
        }
    }

    // Extensions are completed
    if (this.memory.eventFlags[3]['02EXTENSIONS'] == false) {
        if (this.find(FIND_STRUCTURES, {filter: s => s.structureType == STRUCTURE_EXTENSION}).length == CONTROLLER_STRUCTURES['extension'][this.controller.level]) {
            
            for (let i in this.memory.mineRooms) {
                if (i !== this.name) {
                    this.addCreep('RESERVER', [['Reserve', {roomName: i}]])
                }
            }

            this.memory.eventFlags[3]['02EXTENSIONS'] = true
        }
    }
    
    // Room levels up
    if (this.memory.conLevel < this.controller.level && this.controller.level == 4) {
        this.memory.toRCL[4] = Game.time - this.memory.toRCL[3]
        this.setState('RCL4', {})
        return
    }

    // Normal runtime conditions
    this.standardRuntime()
}
Room.prototype.runRCL4 = function(scope) {

    // Initial setup
    if (this.memory.conLevel < this.controller.level && this.controller.level == 4) {
        
        this.memory.eventFlags[4] = {}
        this.memory.eventFlags[4]['01STORAGE'] = false
        this.memory.eventFlags[4]['02EXTENSIONS'] = false

        this.addFromBlueprint(this.memory.Bunker, Memory.Blueprints.Bunker, this.controller.level)
        
        this.memory.conLevel = this.controller.level
    }

    if (this.memory.eventFlags[4]['01STORAGE'] == false) {
        if (this.storage != undefined) {
            let posStr = RoomPosition.serialize(this.storage.pos)
            this.memory.takeFrom.unshift(posStr)
            this.memory.storeTo.push(posStr)

            this.addCreep('CONTROLLER_FILLER', [['DeliverController', {}]], )
            let storagePos = RoomPosition.serialize(this.storage.pos)
            for (let i in this.memory.sources) {
                let newPath = PathFinder.search(this.storage.pos, RoomPosition.parse(this.memory.sources[i].container), {ignoreRoads: true, maxRooms: 4, ignoreCreeps: true, range: 0})

                let serPath = PathFinder.serialize(newPath.path)

                this.memory.sources[i].path = serPath
                this.memory.sources[i].pathLength = newPath.path.length
                
                this.addRoadFromPath(serPath)
            }
            this.updateHaulers(true)

            this.memory.eventFlags[4]['01STORAGE'] = true
        }
    }

    if (this.memory.eventFlags[4]['02EXTENSIONS'] == false) {
        let extensions = this.find(FIND_MY_STRUCTURES, {filter: s => s.structureType == STRUCTURE_EXTENSION})
        if (extensions.length == CONTROLLER_STRUCTURES['extension'][this.controller.level]) {
            
        }
    }
    
    // Room levels up
    if (this.memory.conLevel < this.controller.level && this.controller.level == 5) {
        this.memory.toRCL[5] = Game.time - this.memory.toRCL[4]
        this.setState('RCL5', {})
        return
    }

    // Normal runtime conditions
    this.standardRuntime()
}
Room.prototype.runRCL5 = function(scope) {

    // Initial setup
    if (this.memory.conLevel < this.controller.level && this.controller.level == 5) {
        this.addFromBlueprint(this.memory.Bunker, Memory.Blueprints.Bunker, this.controller.level)
        this.memory.conLevel = this.controller.level
    }
    
    // Room levels up
    if (this.memory.conLevel < this.controller.level && this.controller.level == 6) {
        this.memory.toRCL[6] = Game.time - this.memory.toRCL[5]
        this.setState('RCL6', {})
        return
    }

    // Normal runtime conditions
    this.standardRuntime()
}
Room.prototype.runRCL6 = function(scope) {

    // Initial setup
    if (this.memory.conLevel < this.controller.level && this.controller.level == 6) {
        this.addFromBlueprint(this.memory.Bunker, Memory.Blueprints.Bunker, this.controller.level)
        this.memory.conLevel = this.controller.level
    }
    
    // Room levels up
    if (this.memory.conLevel < this.controller.level && this.controller.level == 7) {
        this.memory.toRCL[7] = Game.time - this.memory.toRCL[6]
        this.setState('RCL7', {})
        return
    }

    // Normal runtime conditions
    this.standardRuntime()
}
Room.prototype.runRCL7 = function(scope) {

    // Initial setup
    if (this.memory.conLevel < this.controller.level && this.controller.level == 7) {
        this.addFromBlueprint(this.memory.Bunker, Memory.Blueprints.Bunker, this.controller.level)
        this.memory.conLevel = this.controller.level
    }
    
    // Room levels up
    if (this.memory.conLevel < this.controller.level && this.controller.level == 8) {
        this.memory.toRCL[8] = Game.time - this.memory.toRCL[7]
        this.setState('RCL8', {})
        return
    }

    // Normal runtime conditions
    this.standardRuntime()
}
Room.prototype.runRCL8 = function(scope) {

    // Initial setup
    if (this.memory.conLevel < this.controller.level && this.controller.level == 8) {
        this.addFromBlueprint(this.memory.Bunker, Memory.Blueprints.Bunker, this.controller.level)
        this.memory.conLevel = this.controller.level
    }

    // Normal runtime conditions
    this.standardRuntime()
}

//      //      //      //      //      //      //      //      //      //      //      //

//      //      //      //      //      //      //      //      //      //      //      //  

Room.prototype.claimRoom = function(roomName) {
    // Automate bunker placement
}

Room.prototype.addFromBlueprint = function(posStr, blueprint, level) {
    let posObj = RoomPosition.parse(posStr)
    
    for (let i in blueprint[level]) {
        let dx = Number(i.substr(0, 3))
        let dy = Number(i.substr(3, 3))
        let newPos = posObj.add(dx, dy)
        this.addStructure(RoomPosition.serialize(newPos), blueprint[level][i])
    }
}

Room.prototype.getTake = function(resourceType = RESOURCE_ENERGY) {

    let fromSpawn = true
    if (this.memory.takeFrom.length > 1) {
        fromSpawn = false
    }
    
    if (resourceType == RESOURCE_ENERGY) {
        for (let i in this.memory.takeFrom) {
            let posObj = RoomPosition.parse(this.memory.takeFrom[i])
            let obj = posObj.lookFor(LOOK_STRUCTURES)[0]
            if (obj.structureType == STRUCTURE_SPAWN && fromSpawn == false) {
                continue
            }
            if ( (obj.energy && obj.energy > 0) || (obj.store && obj.store.energy > 0) ) {
                return this.memory.takeFrom[i]
            }
            else {
                continue
            }
            
        }
    }
    else {
        for (let i in this.memory.takeFrom) {
            let posObj = RoomPosition.parse(this.memory.takeFrom[i])
            let obj = posObj.lookFor(LOOK_STRUCTURE)[0]
            
            if (!obj.store) {
                continue
            }
            if (obj.store[resourceType] !== undefined) {
                return this.memory.takeFrom[i]
            }
        }
    }
    
    return false
}

Room.prototype.getStore = function(resourceType = RESOURCE_ENERGY) {
    if (resourceType == RESOURCE_ENERGY) {
        for (let i in this.memory.storeTo) {
            let posObj = RoomPosition.parse(this.memory.storeTo[i])
            let obj = posObj.lookFor(LOOK_STRUCTURES)[0]
            
            if (obj.energy !== undefined && obj.energy < obj.energyCapacity) {
                return this.memory.storeTo[i]
            }
            else if (obj.store && _.sum(obj.store) < obj.storeCapacity) {
                return this.memory.storeTo[i]
            }
        }
    }
    else {
        for (let i in this.memory.storeTo) {
            let posObj = RoomPosition.parse(this.memory.storeTo[i])
            let obj = posObj.lookFor(LOOK_STRUCTURE)[0]
            
            if (obj.carry == undefined) {
                return false
            }
            
            if (_.sum(obj.store) < obj.storeCapacity) {
                return this.memory.storeTo[i]
            }    
        }
    }
    
    return false
}

Room.prototype.setup = function() {
    this.memory.toRCL = {1: 0}
    this.memory.sources = {}
    this.memory.Creeps = {}
    this.memory.creepCount = 0
    this.memory.stack = [[`RCL${this.controller.level}`, {}]]
    this.memory.queue = []
    this.memory.conLevel = 0
    this.memory.takeFrom =  [RoomPosition.serialize(this.find(FIND_STRUCTURES, {filter: s => s.structureType == STRUCTURE_SPAWN})[0].pos)]
    this.memory.storeTo =   [RoomPosition.serialize(this.find(FIND_STRUCTURES, {filter: s => s.structureType == STRUCTURE_SPAWN})[0].pos)]
    this.memory.Bunker = ''
    this.memory.constructionSites = 0
    this.memory.mineRooms = {}

    this.memory.buildQueue = []
    this.memory.structures = {}
}

Room.prototype.checkToSpawn = function() {
    for (let i in this.memory.Creeps) {
        if (_.isUndefined(Game.creeps[i]) && this.memory.Creeps[i].removeOnDeath == true) {
            this.removeCreep(i)
            continue
        }
        
        else if (_.isUndefined(Game.creeps[i]) && this.memory.Creeps[i].removeOnDeath == false) {
            this.addToQueue(i)
            continue
        }
    }
}
Room.prototype.spawnQueue = function() {
    let useableSpawns = this.find(FIND_STRUCTURES, {filter: s => s.structureType == STRUCTURE_SPAWN && !s.spawning})
    if (useableSpawns.length == 0) {
        return
        // uh oh
    }
    let cap = this.energyCapacityAvailable
    
    if (useableSpawns.length == 0) {
        return
    }
    if (this.memory.queue.length == 0) {
        return
    }
    
    if (this.memory.queue.length == _.keys(this.memory.Creeps).length) {
        cap = 300
    }
    
    for (let i in this.memory.queue) {
        if (_.isUndefined(this.memory.Creeps[this.memory.queue[i]]) || !_.isUndefined(Game.creeps[this.memory.queue[i]])) {
            _.remove(this.memory.queue, i)
        }
    }

    let toSpawn = _.sortBy(this.memory.queue, s => this.memory.Creeps[s].priority)
    for (let i in useableSpawns) {
        if (i > toSpawn.length+1) {
            return true
        }

        let mem = {homeRoom: this.name, stack: _.cloneDeep(this.memory.Creeps[this.memory.queue[i]].baseStack)}
        
        let cName = this.memory.queue[i]
        
        let body
        if (_.isUndefined(this.memory.Creeps[cName].body)) {
            body = this.getBestBody(BODIES[this.memory.Creeps[cName].role], cap)
        }
        else {
            body = this.getBestBody(this.memory.Creeps[cName].body, cap)
        }

        let creepToSpawn = useableSpawns[i].spawnCreep(body, cName, {memory: mem})
        if (creepToSpawn == 0) {
            _.remove(toSpawn, s => s == toSpawn[i])
        }
        else {
            if (creepToSpawn !== -6) {
                console.log(creepToSpawn)
            }
        }
    }
    
    this.memory.queue = toSpawn
}
Room.prototype.addCreep = function(role, baseStack, priority = PRIORITY_BY_ROLE[role], removeOnDeath = false, bodyOverride = false) {
    
    this.memory.creepCount += 1
    if (this.memory.creepCount >= 1e6) {
        this.memory.creepCount = 0
    }
    
    let cName = String(`${this.name}-${this.memory.creepCount}`)
    
    if (this.memory.Creeps[cName]) {
        return false
    }
    
    let outMem = {role: role, baseStack: _.cloneDeep(baseStack), removeOnDeath: removeOnDeath, priority: priority}
    if (bodyOverride !== false) {
        outMem.body = bodyOverride
    }
    if (!baseStack) {
        return false
    }
    this.memory.Creeps[cName] = outMem
}
Room.prototype.removeCreep = function(cName) {
    this.memory.Creeps[cName] = undefined
}

Room.prototype.addToQueue = function(cName) {
    if (!_.includes(this.memory.queue, cName)) {
        this.memory.queue.push(cName)
    }
}
Room.prototype.removeFromQueue = function(cName) {
    _.remove(this.memory.queue, s => s == cName)
}
Room.prototype.checkToBuild = function() {
    let sumRepair = 0
    let targetRooms = []

    this.memory.constructionSites = 0

    for (let i in this.memory.structures) {
        // If there is no id, or there is no object by id
        if (this.memory.structures[i].id == '' || _.isUndefined(this.memory.structures[i].id) || _.isUndefined(Game.getObjectById(this.memory.structures[i].id))) {
            let posObj = RoomPosition.parse(this.memory.structures[i].posStr)
            let roomObj = Game.rooms[posObj.roomName]
            if (_.isUndefined(roomObj)) {
                // cry, no vision
            }
            else {
                let struct = _.find(posObj.lookFor(LOOK_STRUCTURES, s => s.structureType == this.memory.structures[i].structureType))

                // If the structure exists
                if (!_.isUndefined(struct)) {
                    this.memory.structures[i].id = struct.id
                }
                else {
                    // no structure where I thought there was one, check for construction site
                    let constructionTest = _.find(posObj.lookFor(LOOK_CONSTRUCTION_SITES, s => s.structureType == this.memory.structures[i].structureType))
                    if (_.isUndefined(constructionTest)) {
                        // No structure exists, no construction site for it exists
                        this.addBuildQueue(this.memory.structures[i].posStr, this.memory.structures[i].structureType, this.memory.structures[i].priority)
                    }
                    else {
                        // No structure exists, but there is a construction site
                        this.memory.constructionSites++
                    }
                }
            }
        }
        // Repair sequence
        else {
            if (_.any(this.memory.Creeps, s => s.role == 'REPAIRER')) {
                continue
            }

            let toRepair = ['road', 'container']
            if (toRepair.includes(this.memory.structures[i].structureType)) {
                let posObj = RoomPosition.parse(this.memory.structures[i].posStr)
                let struct = _.find(posObj.lookFor(LOOK_STRUCTURES, s => s.structureType == this.memory.structures[i].structureType))
                let partsToRepair = Math.floor((struct.hitsMax - struct.hits) / REPAIR_POWER)
                if (partsToRepair > 2) {
                    if (!targetRooms.includes(struct.pos.roomName)) {
                        targetRooms.push()
                    }
                }
                sumRepair += partsToRepair
            }
            if (sumRepair > this.controller.level*5) {
                this.addCreep('REPAIRER', [['FindRepair', {targetRooms: targetRooms}]], false)
            }
        }
    }
}
Room.prototype.buildQueue = function() {
    let maxBuildSites = 10
    if (this.memory.buildQueue.length == 0) {
        return 'EMPTY'
    }
    
    if (this.memory.constructionSites >= maxBuildSites) {
        this.memory.constructionSites = 0
        return 'BUSY'
    }
    else {

        for (let i in this.memory.buildQueue) {
            let index = this.memory.buildQueue[i]
            if (_.isUndefined(this.memory.structures[index])) {
                _.remove(this.memory.buildQueue, index)
                this.memory.structures[index] = undefined
                continue
            }
        }

        this.memory.buildQueue = _.sortBy(this.memory.buildQueue, s => PRIORITY_BY_STRUCTURE[this.memory.structures[s].structureType]).reverse()
        for (let i = 0; i < Math.min((maxBuildSites - this.memory.constructionSites), this.memory.buildQueue.length); i++) {
            

            let index = this.memory.buildQueue[i]

            let obj = this.memory.structures[index]
            let posObj = RoomPosition.parse(obj.posStr)
            
            if (posObj.lookFor(LOOK_CONSTRUCTION_SITES).length > 0) {
                this.memory.buildQueue.shift()
            }
            
            let conSite = posObj.createConstructionSite(obj.structureType)

            if (conSite == 0) {
                _.remove(this.memory.buildQueue, s => s == index)
            }
        }
    }
}

Room.prototype.addStructure = function(posStr, structureType, priority=PRIORITY_BY_STRUCTURE[structureType]) {
    let combinedStr = posStr + structureType
    this.memory.structures[combinedStr] = {posStr: posStr, structureType: structureType, priority: priority, id: ''}
}
Room.prototype.removeStructure = function(posStr, structureType) {
    let combinedStr = posStr + structureType
    _.remove(this.memory.structures, combinedStr)
    _.remove(this.memory.buildQueue, combinedStr)
}

Room.prototype.addBuildQueue = function(posStr, structureType, priority) {
    let combinedStr = posStr + structureType
    if (this.memory.buildQueue.includes(combinedStr)) {
        return
    }
    let insertIndex = _.sortedLastIndex(this.memory.buildQueue, this.memory.structures, 'priority')
    this.memory.buildQueue.splice(insertIndex, 0, combinedStr)
}
Room.prototype.removeBuildQueue = function(idStr) {
    _.remove(this.memory.buildQueue, idStr)
}

Room.prototype.saturateSource = function(posStr) {
    let numSources = _.keys(this.memory.sources).length
    let minerPriority = 3 + (0.01 + 0.01*(numSources-1)*2)
    let haulerPriority = minerPriority + 0.01

    let thisSource = this.memory.sources[posStr]

    this.addCreep('ENERGY_MINER', [['Mine', {standPosStr: thisSource.container, minePosStr: posStr}]], minerPriority)
    this.addCreep('HAULER', [['Haul', {pickUp: thisSource.container, dist: thisSource.pathLength, dropOff: _.first(this.memory.storeTo)}]], haulerPriority, false, this.getHaulerBody(thisSource.pathLength))
}

Room.prototype.addSource = function(posStr, saturate = true) {
    let posObj = RoomPosition.parse(posStr)
    let obj = _.first(posObj.lookFor(LOOK_SOURCES))
    
    if (obj === undefined ) {
        return false
        // Request vision?
    }
    
    let dropOffSpot = RoomPosition.parse(_.first(this.memory.takeFrom))
    let objPath = PathFinder.search(dropOffSpot, {pos: posObj, range: 1}, {maxRooms: 3})
    let serPath = PathFinder.serialize(objPath.path)
    let pathLength = objPath.path.length
        
    this.memory.sources[posStr] = {path: serPath, pathLength: pathLength, container: RoomPosition.serialize(_.last(objPath.path)), link: '', nextUpdate: Game.time + 100}

    if (saturate === true) {
        this.saturateSource(posStr)
    }
}
Room.prototype.removeSource = function(posStr) {
    this.memory.Sources[posStr] = undefined
}

//      //      //      //      //      //      //      //      //      //      //      //

//      //      //      //      //      //      //      //      //      //      //      //

Room.prototype.sendBiters = function(roomName, amnt=2) {
    if (_.isUndefined(roomName)) {
        return false
    }
    for (let i = 0; i < amnt; i++) {
        this.addCreep('ANKLE_BITER', [['CleanupRoom', {roomName: roomName}]])
    }
}

Room.prototype.defend = function() {
    let hostileCreeps = [...this.find(FIND_HOSTILE_POWER_CREEPS), ...this.find(FIND_HOSTILE_CREEPS)]
    if (hostileCreeps.length > 0 && !_.any(this.memory.Creeps, s => s.role == 'DEFENSE_MELEE')) {
        this.addCreep('DEFENSE_MELEE', [['DefenseMelee', {}]])
    }

    for (let i in this.memory.mineRooms) {
        if (i == this.name) {
            continue
        }
        if (this.memory.mineRooms[i] > 30000) {
            let targetRoom = Game.rooms[i]
            if (_.isUndefined(targetRoom)) {
                return
            }
            else {
                let hostileCreeps = targetRoom.find(FIND_HOSTILE_CREEPS)
                if (hostileCreeps.length > 0 && _.any(hostileCreeps, s => s.owner.username == 'Invader')) {
                    this.memory.mineRooms[i] = 0
                    this.addCreep('DEFENSE_MELEE', [['DefenseMelee', {roomName: i}]])
                }
            }
        }
    }

    // for (let i in this.memory.remoteMines) {
    //     let needToSpawn = false
    //     if (this.memory.remoteMines[i]) {
    //         let exitRooms = Game.rooms[i].describeExits()
    //         for (let v in exitRooms) {
    //             if (!Game.rooms[exitRooms[v]].controller || !Game.rooms[exitRooms[v]].controler.my) {
    //                 needToSpawn = true
    //                 break
    //             }
    //         }
    //     }
    //     if (needToSpawn == true) {
    //         this.addCreep('DEFENSE_MELEE', [['NoRespawn', {}], ['DefenseMelee', {roomName: i}]])
    //     }
    // }

}

Room.prototype.fireTowers = function() {
    let hostileCreeps = this.find(FIND_HOSTILE_CREEPS, {filter: s => !s.pos.isOnEdge() || !s.pos.isNearExit()})
    if (hostileCreeps.length == 0) {
        return
    }
    let targets = _.sortBy(hostileCreeps, s => s.getHealing())
    let towers = this.find(FIND_MY_STRUCTURES, {filter: s => s.structureType == STRUCTURE_TOWER})

    if (_.isUndefined(towers)) {
        return
    }

    for (let i in towers) {
        towers[i].attack(_.last(hostileCreeps))
    }
}

Room.prototype.updateSourcePathes = function() {
    let storagePos = RoomPosition.serialize(this.storage.pos)
    for (let i in this.memory.sources) {
        let newPath = PathFinder.search(this.storage.pos, RoomPosition.parse(this.memory.sources[i].container), {ignoreRoads: true, maxRooms: 4, ignoreCreeps: true, range: 0})

        let serPath = PathFinder.serialize(newPath.path)

        this.memory.sources[i].path = serPath
        this.memory.sources[i].pathLength = newPath.path.length
    }
}

//      //      //      //      //      //      //      //      //      //      //      //

//      //      //      //      //      //      //      //      //      //      //      //

Room.prototype.getBestBody = function(body, cap=this.energyCapacityAvailable) {
    // be wary of starving room of energy

    let filler = _.any(this.memory.Creeps, s => s.role == 'EXTENSIONER' && _.isUndefined(Game.creeps[s]))
    if (filler == false) {
        cap = Math.min(this.energyAvailable, 300)
    }

    let calcCost = 0
    let calcBod = []
    for (let bPart in body) {
        calcCost += BODYPART_COST[body[bPart]]
        if (calcCost <= cap && calcBod.length < 50) {
            calcBod.push(body[bPart])
        }
    }


    if (_.last(calcBod) == MOVE && body.length !== 1) {
        calcBod.pop()
    }

    return _.sortBy(calcBod, (v, k) => _.indexOf(BODY_ORDER, v))
}

Room.prototype.getHaulerBody = function(dist, energyCapacity = 3000, roads = false) {

    let carryParts = Math.ceil((dist*2)*(energyCapacity/ENERGY_REGEN_TIME)/(CARRY_CAPACITY))

    if (dist > CREEP_LIFE_TIME/2) {
        // too far
        return false
    }

    if (carryParts*1.5 > 50) {
        // Split into two haulers?
        return false
    }
    
    let body = []
    
    if (roads == false) {
        for (let v = 0; v < carryParts; v++) {
            body.push(MOVE)
            body.push(CARRY)
        }
    }
    else {
        for (let v = 0; v < Math.ceil(carryParts/2); v++) {
            body.push(MOVE)
            body.push(CARRY)
            body.push(CARRY)
        }
    }
    return body
}

Room.prototype.updateHaulers = function(roads = false) {
    let haulerCreeps = _.filter(this.memory.Creeps, s => s.role == 'HAULER')
    for (let i in haulerCreeps) {
        let sourceMem = _.find(this.memory.sources, s => s.container == _.last(haulerCreeps[i].baseStack)[1].pickUp)
        haulerCreeps[i].body = this.getHaulerBody(sourceMem.pathLength, 3000, roads)
        _.last(haulerCreeps[i].baseStack)[1].dist = sourceMem.pathLength
    }
}

//      //      //      //      //      //      //      //      //      //      //      //

//      //      //      //      //      //      //      //      //      //      //      //

Room.prototype.getStructures = function(newPos, toStore, range = 4) {
    let newStructs = newPos.findInRange(FIND_STRUCTURES, range)

    let structs = {}

    for (let i in newStructs) {
        let structPos = newStructs[i].pos
        let dx = structPos.x - newPos.x
        let dy = structPos.y - newPos.y

        let sdx = dx.addLeadingZeros(2, true)
        let sdy = dy.addLeadingZeros(2, true)

        let strIndex = `${sdx}${sdy}`

        if (toStore[strIndex] === undefined || (toStore[strIndex] !== undefined && !toStore[strIndex].includes(newStructs[i].structureType))) {

            if (_.isUndefined(structs[strIndex])) {
                structs[strIndex] = []
            }

            structs[strIndex].push(newStructs[i].structureType)
        }
    }

    return structs
}

Room.prototype.addRoadFromPath = function(pathStr, placeOnLast = false) {
    let path = PathFinder.parse(pathStr)
    console.log(path)
    for (let i in path) {
        let posObj = RoomPosition.parse(path[i])
        if (posObj.isOnEdge()) {
            continue
        }
        if (placeOnLast && i == path.length-1) {
            break
        }
        this.addStructure(path[i], STRUCTURE_ROAD, PRIORITY_BY_STRUCTURE[STRUCTURE_ROAD] + 1*(path.length-i))
    }
}

//      //      //      //      //      //      //      //      //      //      //      //

//      //      //      //      //      //      //      //      //      //      //      //

Room.prototype.invokeState = function() {
    if (_.keys(this.memory).length == 0) {
        this.setup()
        return
    }
    
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

Room.prototype.getState = function(defaultState = "Idle") {
    if (!this.memory.stack) {
        return defaultState
    }
    
    return this.memory.stack[0][0] || defaultState
}

Room.prototype.setState = function(state, scope={}) {
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

Room.prototype.pushState = function(state, scope={}, runNext = false) {
    if (!this.memory.stack) {
        this.memory.stack = []
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
        this.invokeState()
    }
    return state
}

Room.prototype.skipState = function() {
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

Room.prototype.popState = function(runNext = false) {
    if (!this.memory.stack || !this.memory.stack.length) {
        return false
    }
    
    let [state] = this.memory.stack.shift()
    if (!this.memory.stack.length) {
        this.memory.stack = undefined
    }
    
    if (runNext) {
        this.invokeState()
    }
}

Room.prototype.clearStack = function() {
    this.memory.stack = undefined
}

Room.prototype.runWait = function(scope) {
    let {until} = scope
    
    if (until >= Game.time) {
        this.popState()
    }
}