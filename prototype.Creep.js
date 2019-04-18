'use strict'

Creep.prototype.runMoveTo = function(scope) {    
    let {posStr, range = 1, exitOnRoom = false} = scope
    let posObj = RoomPosition.parse(posStr)
    
    if (exitOnRoom == true && this.room.name == posObj.roomName && (this.pos.x < 48 && this.pos.x > 1 && this.pos.y < 48 && this.pos.y > 1)) {
        this.popState()
        return
    }
    if (this.pos.inRangeTo(posObj, range)) {
        this.popState()
        return
    }
    else {
        if (exitOnRoom == false) {
            this.moveTo(posObj)
        }
        else {
            this.moveTo(posObj, {range: 20})
        }
    }
}

Creep.prototype.runUpgrade = function(scope) {
    let {cont} = scope

    let homeRoom = Game.rooms[this.memory.homeRoom]
    let posObj = homeRoom.controller
    let posStr = RoomPosition.serialize(posObj.pos)
    
    if (this.carry.energy === 0) {
        if (cont == true) {
            let getTake = homeRoom.getTake(RESOURCE_ENERGY)
            if (getTake != false) {
                this.pushState('PickUp', {posStr: getTake, res: RESOURCE_ENERGY})
            }
            else {
                this.pushState('Wait', {until: Game.time+5})
            }
        }
        else {
            this.popState()
        }
    }
    else {
        if (!this.pos.inRangeTo(posObj, 3)) {
            this.pushState('MoveTo', {posStr: posStr, range: 3})
        }
        else {
            this.upgradeController(posObj)
        }
    }
}

Creep.prototype.runScout = function(scope) {
    let {roomName, roomList = [], message='', addSources = false} = scope
    if (this.room.name !== roomName) {
        let route = Game.map.findRoute(this.room, roomName, {routeCallback(rName, frName) {
            if (Room.describe(rName) == 'SOURCE_KEEPER' || Room.describe(frName) == 'SOURCE_KEEPER') {
                return 50
            }
            else {
                return 1
            }
        }})
        let nextRoom = _.first(route).room
        let roomPos = new RoomPosition(24, 24, nextRoom)

        this.pushState('MoveTo', {posStr: RoomPosition.serialize(roomPos), exitOnRoom: true})
    }
    else {
        
        if (addSources == true) {
            let sources = this.room.find(FIND_SOURCES)
            if (sources.length !== 0) {
                for (let i in sources) {
                    let posStr = RoomPosition.serialize(sources[i].pos)
                    Game.rooms[this.memory.homeRoom].addSource(posStr)
                }
            }
        }
        else {
        
            if (this.pos.inRangeTo(this.room.controller.pos, 1)) {
                if (this.room.controller.sign !== message) {
                    this.signController(this.room.controller, message)
                }
                else {
                    this.pushState('Trample', {})
                }
            }
            else {
                this.pushState('MoveTo', {posStr: RoomPosition.serialize(this.room.controller.pos)})
            }
        }
    }
}

Creep.prototype.runTrample = function(scope) {
    let {} = scope

    let conSites = this.room.find(FIND_HOSTILE_CONSTRUCTION_SITES, {filter: s => s.pos.lookFor(LOOK_CREEPS).length == 0})
    if (conSites.length > 0) {
        let tConSite = this.pos.findClosestByRange(conSites)
        this.pushState('MoveTo', {posStr: RoomPosition.serialize(tConSite.pos), range: 0})
    }
    else {
        this.pushState('Wait', {until: Game.time+10})
    }
}

Creep.prototype.runFillExtensions = function(scope) {
    let {path = false, exit=false} = scope
    
    if (path == false) {
        if (this.room.energyAvailable < this.room.energyCapacityAvailable) {
            
            if (_.sum(this.carry) == 0) {
                let takeFrom = this.room.getTake()
                
                if (takeFrom == false) {
                    let toFind = _.find(this.room.find(FIND_STRUCTURES), s => ((s.store !== undefined & s.store.energy > 0) || (s.energy !== undefined && s.energy > 0)) && s.structureType !== STRUCTURE_SPAWN && s.structureType !== STRUCTURE_EXTENSION)
                    this.pushState('PickUp', {posStr: RoomPosition.serialize(toFind.pos), res: RESOURCE_ENERGY}, true)
                }
                else {
                    this.pushState('PickUp', {posStr: this.room.getTake(), res: RESOURCE_ENERGY}, true)
                }
            }
            else {
                let extensions = this.room.find(FIND_STRUCTURES, {filter: s => (s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_EXTENSION) && s.energy < s.energyCapacity})
                
                if (extensions.length == 0) {
                    this.pushState('Wait', {until: Game.time+3})
                }
                else {
                    let posStr = RoomPosition.serialize(this.pos.findClosestByRange(extensions).pos)
                    this.pushState('DropOff', {posStr: posStr}, true)
                }
                
            }
        }
        else {
            if (exit == false) {
                this.pushState('Wait', {until: Game.time+3})
            }
            else {
                this.popState()
            }
        }
    }
    
}

Creep.prototype.runRepair = function(scope) {
    let {posStr} = scope
    let homeRoom = Game.rooms[this.memory.homeRoom]

    if (_.sum(this.carry) == 0) {
        let pickUp = homeRoom.getTake(RESOURCE_ENERGY)
        this.pushState('PickUp', {posStr: pickUp})
        return
    }
    else {
        let posObj = RoomPosition.parse(posStr)
        let struct = _.find(posObj.lookFor(LOOK_STRUCTURES), s => this.getRepairPower() <= (s.hitsMax - s.hits))
        if (_.isUndefined(struct)) {
            this.popState()
        }
        else {
            if (!this.pos.inRangeTo(posObj, 3)) {
                this.pushState('MoveTo', {posStr: posStr, range: 3})
            }
            else {
                this.repair(struct)
            }

        }
    
        
    }
}

Creep.prototype.runFindRepair = function(scope) {
    let {} = scope
    let homeRoom = Game.rooms[this.memory.homeRoom]
    
    if (_.sum(this.carry) == 0) {
        let pickUp = homeRoom.getTake(RESOURCE_ENERGY)
        this.pushState('PickUp', {posStr: pickUp})
    }
    else {
        let noRepair = ['wall', 'rampart', 'controller']
        let toRepair = this.room.find(FIND_STRUCTURES, {filter: s => this.getRepairPower() <= (s.hitsMax - s.hits) && !noRepair.includes(s.structureType)})
        if (toRepair.length == 0) {
            let conPos = RoomPosition.serialize(this.room.controller.pos)
            this.pushState('Upgrade', {posStr:conPos, cont: false})
        }
        else {
            let repairTarg = _.first(toRepair)
            this.pushState('Repair', {posStr: RoomPosition.serialize(repairTarg.pos)})
        }
    }
}

Creep.prototype.runBuild = function(scope) {
    let {posStr, getPosStr = false} = scope
    let posObj = RoomPosition.parse(posStr).lookFor(LOOK_CONSTRUCTION_SITES)[0]
    
    if (!posObj) {
        this.popState()
        return
    }
    
    if (this.carry.energy === 0) {
        if (getPosStr !== false) {
            let getPosObj = RoomPosition.parse(getPosStr).lookFor(LOOK_STRUCTURES)[0]
            this.pushState('PickUp', {posStr: getPosStr, res: RESOURCE_ENERGY})
            return
        }
        else {
            this.popState()
            return
        }
        return
    }
    else {
        if (!this.pos.inRangeTo(posObj, 3)) {
            this.pushState('MoveTo', {posStr: posStr, range: 3})
            return
        }
        else {
            let bld = this.build(posObj)
            if (!posObj || posObj.progress == posObj.progressTotal) {
                this.popState()
                return
            }
        }
    }
    
}

Creep.prototype.runHarvest = function(scope) {
    let homeRoom = Game.rooms[this.memory.homeRoom]
    let {posStr, stationary = false} = scope
    let posObj = RoomPosition.parse(posStr)
    
    if (_.sum(this.carry) == this.carryCapacity) {
        let dropOff = homeRoom.getStore(RESOURCE_ENERGY)
        
        if (dropOff == false) {
            let cSites = this.room.find(FIND_CONSTRUCTION_SITES)
            if (cSites.length > 0) {
                let tSite = _.first(cSites)
                this.pushState('Build', {posStr: RoomPosition.serialize(tSite.pos)})
            }
            else {
                this.pushState('Upgrade', {posStr: RoomPosition.serialize(homeRoom.controller.pos), cont: false})
            }
        }
        else {
            this.pushState('DropOff', {posStr: homeRoom.getStore(RESOURCE_ENERGY)})
        }
    }
    else {
        
        
        if (!this.pos.inRangeTo(posObj, 1)) {
            this.pushState('MoveTo', {posStr: posStr})
        }
        else {
            let targObj = posObj.lookFor(LOOK_SOURCES)[0]
            let harvestAction = this.harvest(targObj)
            
            
            if (harvestAction == 0) {
                if (_.isUndefined(homeRoom.memory.mineRooms[this.room.name])) {
                    homeRoom.memory.mineRooms[this.room.name] = 0
                }
                homeRoom.memory.mineRooms[this.room.name] += this.getMinePower()
            }
        }
    }
}

Creep.prototype.runMineMineral = function(scope) {
    let {} = scope
}

Creep.prototype.runMine = function(scope) {
    let {standPosStr, minePosStr} = scope
    let standPosObj = RoomPosition.parse(standPosStr)

    if (!this.pos.inRangeTo(standPosObj, 0)) {
        // move by path?
        this.pushState('MoveTo', {posStr: standPosStr, range: 0})
    }
    else {
        let minePosObj = RoomPosition.parse(minePosStr)
        let mineObj = _.first(minePosObj.lookFor(LOOK_SOURCES))
        let energyPerMine = this.getMinePower()

        if (mineObj.energy > 0) { 
            if (_.sum(this.carry) + energyPerMine > this.carryCapacity) {
                let container = _.find(standPosObj.lookFor(LOOK_STRUCTURES), s => s.structureType == STRUCTURE_CONTAINER)
                if (_.isUndefined(container)) {
                    let conSite = _.find(standPosObj.lookFor(LOOK_CONSTRUCTION_SITES), s => s.structureType == STRUCTURE_CONTAINER)
                    if (_.isUndefined(conSite)) {
                        Game.rooms[this.memory.homeRoom].addStructure(standPosStr, STRUCTURE_CONTAINER)
                    }
                    else {
                        this.build(conSite)
                    }
                }
                else {
                    if (this.getRepairPower() <= (container.hitsMax - container.hits)) {
                        this.repair(container)
                    }
                    else {
                        let harvestAction = this.harvest(mineObj)
                        if (harvestAction == 0) {
                            homeRoom.memory.mineRooms[this.room.name] += this.getMinePower()
                        }
                    }
                }
            }
            else {
                let harvestAction = this.harvest(mineObj)
                if (harvestAction == 0) {
                    homeRoom.memory.mineRooms[this.room.name] += this.getMinePower()
                }
            }
        }
        else {
            // mope, nothing to mine
        }
    }
}

Creep.prototype.runHaul = function(scope) {
    let {pickUp, dropOff, dist=20} = scope

    let homeRoom = Game.rooms[this.memory.homeRoom]
    if (this.ticksToLive < dist*2+10) {
        //this.pushState('Recycle', {posStr: spawnPos})
        this.suicide()
    }
    else {
        if (_.sum(this.carry) == 0) {
            this.pushState('PickUp', {posStr: pickUp})
        }
            
        else {
            this.pushState('DropOff', {posStr: homeRoom.getStore()})
        }
    }
}

Creep.prototype.runRenew = function(scope) {
    let {posStr, minTicks} = scope
    let posObj = RoomPosition.parse(posStr)
    
    if (!this.pos.inRangeTo(posObj, 1)) {
        this.pushState('MoveTo', {posStr: posStr})
    }
    else {
        let targObj = _.filter(posObj.lookFor(LOOK_STRUCTURES), s => s.structureType == STRUCTURE_SPAWN)[0]
        
        if (targObj.energy >= Math.ceil(this.getBodyCost()/2.5/this.body.length)) {
            targObj.renewCreep(this)
        }
        else {
            this.popState()
        }
        
        if (this.ticksToLive >= minTicks) {
            this.popState()
        }
    }
}

Creep.prototype.runPickUp = function(scope) {
    let {posStr, res = RESOURCE_ENERGY} = scope
    let posObj = RoomPosition.parse(posStr)
    
    if (!this.pos.inRangeTo(posObj, 1)) {
        this.pushState('MoveTo', {posStr: posStr})
        return
    }
    else {

        if (_.sum(this.carry) == this.carryCapacity) {
            this.popState()
        }
        else {
            let posStruct = _.first(posObj.lookFor(LOOK_STRUCTURES))
            if (_.isUndefined(posStruct)) {
                let resObj = _.find(posObj.lookFor(LOOK_RESOURCES), s => s.resourceType == res)
                if (_.isUndefined(resObj)) {
                    let creepObj = _.find(posObj.lookFor(LOOK_CREEPS), s => s.my && s.carry.energy > 0)
                    if (_.isUndefined(creepObj)) {
                        this.popState()
                    }
                    else {
                        let state = creepObj.transfer(this, RESOURCE_ENERGY)
                        if (state == 0 || _.sum(this.carry) == this.carryCapacity) {
                            this.popState()
                        }
                    }
                }
                else {
                    let state = this.pickup(resObj)
                    if (state == 0 || _.sum(this.carry) == this.carryCapacity) {
                        this.popState()
                    }
                }
            }
            else {
                let state = this.withdraw(posStruct, res)
                if (state == 0 || _.sum(this.carry) == this.carryCapacity) {
                    this.popState()
                }
            }
        }
    }
}

Creep.prototype.runFindBuild = function(scope) {
    let {} = scope
    let homeRoom = Game.rooms[this.memory.homeRoom]

    if (homeRoom.memory.buildQueue.length == 0) {
        this.pushState('Wait', {until: Game.time+20})
    }
    else {
        let posStr = _.first(homeRoom.memory.buildQueue)
        this.pushState('Build', {posStr: posStr})
    }
}

Creep.prototype.runTrackAttack = function(scope) {
    
}
Creep.prototype.runDismantle = function(scope) {
    let {targetList = [], roomName} = scope
    if (this.room.name !== roomName) {
        let route = Game.map.findRoute(this.room, roomName, {routeCallback(rName, frName) {
            if (Room.describe(rName) == 'SOURCE_KEEPER' || Room.describe(frName) == 'SOURCE_KEEPER') {
                return 50
            }
            else {
                return 1
            }
        }})
        let nextRoom = _.first(route).room
        let roomPos = new RoomPosition(24, 24, nextRoom)

        this.pushState('MoveTo', {posStr: RoomPosition.serialize(roomPos), exitOnRoom: true})
    }
    else {
        for (let i in targetList) {
            let target = RoomPosition.parse(targetList[i])
            console.log(target)
            let targetStructure = _.find(target.lookFor(LOOK_STRUCTURES), s => s.structureType !== STRUCTURE_ROAD)

            if (_.isUndefined(targetStructure)) {
                continue
            }
            else {
                if (this.pos.inRangeTo(target, 1)) {
                    this.dismantle(targetStructure)
                }
                else {
                    this.pushState('MoveTo', {posStr: targetList[i]})
                }
            }
        }
    }

}

Creep.prototype.runDismantleRoom = function(scope) {
    let {roomName} = scope
    if (this.room.name !== roomName) {
        let route = Game.map.findRoute(this.room, roomName, {routeCallback(rName, frName) {
            if (Room.describe(rName) == 'SOURCE_KEEPER' || Room.describe(frName) == 'SOURCE_KEEPER') {
                return 50
            }
            else {
                return 1
            }
        }})
        let nextRoom = _.first(route).room
        let roomPos = new RoomPosition(24, 24, nextRoom)

        this.pushState('MoveTo', {posStr: RoomPosition.serialize(roomPos), exitOnRoom: true})
    }
    else {
        let structures = this.room.find(FIND_STRUCTURES)
        if (structures.length > 0) {
            let targetStructure = _.last(_.sortBy(structures, s => s.structureType !== STRUCTURE_CONTROLLER && PRIORITY_BY_STRUCTURE[s.structureType]))
            if (this.pos.inRangeTo(targetStructure, 1)) {
                this.dismantle(targetStructure)
            }
            else {
                this.pushState('MoveTo', {posStr: RoomPosition.serialize(targetStructure.pos)})
            }
        }
        else {
            this.pushState('Trample', {})
        }

    }    
}

Creep.prototype.runDefenseMelee = function(scope) {
    let {roomName = this.memory.homeRoom} = scope
    if (this.room.name !== roomName) {
        let route = Game.map.findRoute(this.room, roomName, {routeCallback(rName, frName) {
            if (Room.describe(rName) == 'SOURCE_KEEPER' || Room.describe(frName) == 'SOURCE_KEEPER') {
                return 50
            }
            else {
                return 1
            }
        }})
        let nextRoom = _.first(route).room
        let roomPos = new RoomPosition(24, 24, nextRoom)

        this.pushState('MoveTo', {posStr: RoomPosition.serialize(roomPos), exitOnRoom: true})
    }
    else {
        let hostileCreeps = [...this.room.find(FIND_HOSTILE_POWER_CREEPS), ... this.room.find(FIND_HOSTILE_CREEPS)]
        if (hostileCreeps.length == 0) {
            Game.rooms[this.memory.homeRoom].Creeps[this.name].removeOnDeath = true
        }
        else {
            let target = _.min(hostileCreeps, s => s.getHealing())
            this.pushState('AttackMove', {targetID: target.id}, true)
        }

    }
}

Creep.prototype.runCleanupRoom = function(scope) {
    let {roomName} = scope
    if (this.room.name !== roomName) {
        let route = Game.map.findRoute(this.room, roomName, {routeCallback(rName, frName) {
            if (Room.describe(rName) == 'SOURCE_KEEPER' || Room.describe(frName) == 'SOURCE_KEEPER') {
                return 50
            }
            else {
                return 1
            }
        }})
        let nextRoom = _.first(route).room
        let roomPos = new RoomPosition(24, 24, nextRoom)

        this.pushState('MoveTo', {posStr: RoomPosition.serialize(roomPos), exitOnRoom: true})
    }
    else {
        let noKill = ['container', 'controller', 'road']
        let structures = this.room.find(FIND_STRUCTURES, {filter: s => !noKill.includes(s.structureType)})
        if (structures.length > 0) {
            let targetStructure = _.last(_.sortBy(structures, s => PRIORITY_BY_STRUCTURE[s.structureType]))
            this.pushState('AttackMove', {targetID: targetStructure.id})
        }
        else {
            let creeps = this.room.find(FIND_HOSTILE_CREEPS)
            if (creeps.length > 0) {
                let targetCreep = this.pos.findClosestByRange(creeps)
                this.pushState('AttackMove', {targetID: targetCreep.id})
            }
            else {
                this.say('O')
                Game.rooms[this.memory.homeRoom].memory.Creeps[this.name].removeOnDeath = true
                this.pushState('Trample', {})
            }
        }
    }    
}

Creep.prototype.runAttackMove = function(scope) {
    let {targetID, roomName=this.room.name} = scope
    if (this.room.name !== roomName) {
        let route = Game.map.findRoute(this.room, roomName, {routeCallback(rName, frName) {
            if (Room.describe(rName) == 'SOURCE_KEEPER' || Room.describe(frName) == 'SOURCE_KEEPER') {
                return 50
            }
            else {
                return 1
            }
        }})
        let nextRoom = _.first(route).room
        let roomPos = new RoomPosition(24, 24, nextRoom)

        this.pushState('MoveTo', {posStr: RoomPosition.serialize(roomPos), exitOnRoom: true})
    }
    else {
        let targetObj = Game.getObjectById(targetID)
        if (targetObj == undefined) {
            this.popState()
        }
        else {
            if (this.pos.inRangeTo(targetObj, 1)) {
                this.attack(targetObj)
            }
            else {
                let adjCreeps = this.pos.findInRange(FIND_HOSTILE_CREEPS)
                if (adjCreeps.length > 0) {
                    this.attack(_.first(adjCreeps))
                }
                this.moveTo(targetObj)
            }
        }
    }
}

//      //      //      //      //      //      //      //      //      //

//      //      //      //      //      //      //      //      //      //

Creep.prototype.runRecycle = function(scope) {
    let {posStr} = scope
    let posObj = RoomPosition.parse(posStr)
    
    if (!this.pos.inRangeTo(posObj, 1)) {
        this.pushState('MoveTo', {posStr: posStr})
        return
    }
    else {
        posObj.recycleCreep(this)
    }
    
}

Creep.prototype.runDropOff = function(scope) {
    let {posStr} = scope
    
    if (typeof posStr !== 'string') {
        this.popState()
    }
    
    if (posStr == false) {
        this.pushState('Wait', {until: Game.time+5})
        return
    }
    let posObj = RoomPosition.parse(posStr)
    
    if (!this.pos.inRangeTo(posObj, 1)) {
        this.pushState('MoveTo', {posStr: posStr})
        return
    }
    if (_.sum(this.carry) == 0) {
        this.popState()
        return
    }
    if (this.pos.inRangeTo(posObj, 1)) {
        let targObj = posObj.lookFor(LOOK_STRUCTURES)[0]
        
        let transAction = this.transfer(targObj, _.max(_.keys(this.carry), s => this.carry[s]))
        if (transAction == -8) {
            this.popState()
        }
    }
}

Creep.prototype.runNoRespawn = function(scope) {
    let {} = scope
    Game.rooms[this.memory.homeRoom].memory.Creeps[this.name].removeOnDeath = true
}

Creep.prototype.getBodyCost = function() {
    return _.sum(_.map(this.body, s => BODYPART_COST[s.type]))
}

Creep.prototype.getTombstoneDrop = function() {
    let drops = {energy: 0}
    let timeToLive = ( this.ticksToLive > CREEP_CLAIM_LIFE_TIME || _.any(this.body, {type: CLAIM}) ) ? CREEP_LIFE_TIME : CREEP_CLAIM_LIFE_TIME
    let lifeRate = 0.2 * this.ticksToLive / timeToLive

    this.body.forEach(function(s) {
        if (s.boost) {
            drops[s.boost] =    drops[s.boost] || 0
            drops[s.boost] +=   LAB_BOOST_MINERAL * lifeRate
            drops[energy] +=    LAB_BOOST_ENERGY * lifeRate
        }
        drops['energy'] += BODYPART_COST[s.type] * lifeRate
    })

    return drops
}

Creep.prototype.getMinePower = function(energy = true) {
    return _.filter(this.body, s => s.type == WORK && s.hits > 0).length * (energy ? HARVEST_POWER : HARVEST_MINERAL_POWER)
}

Creep.prototype.getHealingPower = function() {
    let mults = {XLHO2: 4, LHO2: 3, LO: 2, None: 1}
    let healParts = _.countBy(_.filter(this.body, s => s.type == HEAL), s => s.boost || 'None')

    let sum = 0
    for (let bst in healParts) {
        sum += mults[bst] * healPart[bst] * 12
    }

    return sum
}

Creep.prototype.getHealing = function() {
    let adjCreeps = [...this.pos.findInRange(FIND_HOSTILE_CREEPS, 1), this]
    let nearCreeps = _.filter(this.pos.findInRange(FIND_HOSTILE_CREEPS, 3), s => this.pos.getRangeTo(s) > 1)

    let sum = 0
    for (let tCreep in adjCreeps) {
        sum += adjCreeps[tCreep].getHealingPower()
    }
    for (let tCreep in nearCreeps) {
        sum += nearCreeps[tCreep].getHealingPower() * (1/3)
    }

    return sum
}

Creep.prototype.getRepairPower = function() {
    return _.filter(this.body, s => s.type == WORK && s.hits > 0).length * REPAIR_POWER
}
