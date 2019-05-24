PowerCreep.prototype.runMoveTo = function(scope) {
    let {posStr, range = 1, travel = false, ignoreCreeps = false} = scope
    let posObj = RoomPosition.parse(posStr)

    if (this.room.name !== posObj.roomName) {
        if (travel == false) {
            let route = Game.map.findRoute(this.room, posObj.roomName, {routeCallback(rName, frName) {
                if (Room.describe(rName) == 'SOURCE_KEEPER' || Room.describe(frName) == 'SOURCE_KEEPER') {
                    return 50
                }
                else {
                    return 1
                }
            }})
            let nextRoom = _.first(route).room
            let roomPos = new RoomPosition(24, 24, nextRoom)
            if (this.pos.inRangeTo(posObj, range)) {
                this.popState()
            }
            else {
                this.pushState('MoveTo', {range: 2, posStr: RoomPosition.serialize(roomPos), travel: true})
            }
        }
        else {
            this.moveTo(posObj, {range: range, ignoreCreeps: ignoreCreeps, ignoreRoads: true})
        }
    }

    else {
        if (this.room.name == posObj.roomName) {
            if (travel == true && !this.pos.isNearExit()) {
                this.popState()
            }
            else {
                if (this.pos.inRangeTo(posObj, range)) {
                    this.popState()
                }
                else {
                    this.moveTo(posObj, {range: range, ignoreCreeps: ignoreCreeps, ignoreRoads: true})
                }
            }
        }
    }
}

PowerCreep.prototype.runTravelTo = function(scope) {
    let {roomName} = scope

    if (this.room.name !== roomName) {
        if (_.isUndefined(this.memory.targetRoom)) {
            let route = Game.map.findRoute(this.room.name, roomName)
            this.memory.targetRoom = _.first(route).room
        }
        
        if (this.room.name !== this.memory.targetRoom) {
            if (_.isUndefined(this.memory.targetSpot)) {
                let targetExit = this.room.findExitTo(this.memory.targetRoom)
                let targetSpots = this.room.find(targetExit)
                this.memory.targetSpot = RoomPosition.serialize(this.pos.findClosestByPath(targetSpots))
            }

            this.moveTo(RoomPosition.parse(this.memory.targetSpot, {ignoreRoads: true}))

        }
        else {
            this.memory.targetSpot = undefined
            this.memory.targetRoom = undefined
        }

    }
    else {
        this.popState()
    }

}

PowerCreep.prototype.runRenew = function(scope) {
    let {} = scope
    let targetSpawn = _.find(Game.rooms[this.memory.homeRoom].find(FIND_MY_STRUCTURES), s => s.structureType == STRUCTURE_POWER_SPAWN)

    if (_.isUndefined(targetSpawn)) {
        this.popState()
    }

    if (!this.pos.inRangeTo(targetSpawn, 1)) {
        this.pushState('MoveTo', {posStr: RoomPosition.serialize(targetSpawn.pos)})
    }
    else {
        this.renew(targetSpawn)
        this.popState()
        this.pushState('AvoidStructures', {})
        return
    }
}

PowerCreep.prototype.runOperate = function(scope) {
    let {} = scope

    if (_.isUndefined(this.shard)) {
        return false
    }

    if (_.isUndefined(this.memory.homeRoom)) {
        this.memory.homeRoom = 'W47N49'
    }

    let homeRoom = Game.rooms[this.memory.homeRoom]
    if (!homeRoom.controller.isPowerEnabled) {
        this.pushState('EnableRoom', {roomName: homeRoom.name})
        return
    }

    if (this.ticksToLive < 500) {
        this.pushState('Renew', {})
        return
    }

    if (this.powers[PWR_GENERATE_OPS] && this.powers[PWR_GENERATE_OPS].cooldown == 0) {
        this.usePower(PWR_GENERATE_OPS)
    }

    if (this.powers[PWR_OPERATE_STORAGE] && this.powers[PWR_OPERATE_STORAGE].cooldown == 0 && this.carry[RESOURCE_OPS] && this.carry[RESOURCE_OPS] >= 100) {
        if (!this.pos.inRangeTo(Game.rooms[this.memory.homeRoom].storage, 3)) {
            this.pushState('MoveTo', {posStr: RoomPosition.serialize(Game.rooms[this.memory.homeRoom].storage.pos)})
        }
        else {
            this.usePower(PWR_OPERATE_STORAGE, this.room.storage)
            this.pushState('AvoidStructures', {})
        }
    }
    
    if (_.sum(this.carry) >= this.carryCapacity) {
        let toStore = this.room.getStore(RESOURCE_OPS)
        this.pushState('Deliver', {posStr: toStore, res: RESOURCE_OPS})
    }
}

PowerCreep.prototype.runAvoidStructures = function(scope) {
    let {} = scope

    if (_.isUndefined(this.shard)) {
        this.popState()
        return false
    }

    if (_.isUndefined(this.memory.toPos)) {
        let structs = this.room.find(FIND_STRUCTURES)
        let structGoal = _.map(structs, s => s = {pos: s.pos, range: 1})
        let pFind = PathFinder.search(this.pos, structGoal, {flee: true})
        
        if (pFind.path.length == 0) {
            this.popState()
            return
        }

        this.memory.toPos = RoomPosition.serialize(_.last(pFind.path))
    }

    let posObj = RoomPosition.parse(this.memory.toPos)
    if (!this.pos.inRangeTo(posObj, 0)) {
        this.pushState('MoveTo', {posStr: this.memory.toPos, range: 0})
    }
    else {
        this.memory.toPos = undefined
        this.popState()
        return
    }
}

PowerCreep.prototype.runEnableRoom = function(scope) {
    let {roomName} = scope
    if (this.pos.roomName != roomName) {
        this.pushState('TravelTo', {roomName: roomName})
    }
    else {
        if (!this.pos.inRangeTo(Game.rooms[roomName].controller, 1)) {
            this.pushState('MoveTo', {posStr: RoomPosition.serialize(Game.rooms[roomName].controller.pos), range: 1})
        }
        else {
            this.enableRoom(this.room.controller)
            this.popState()
        }
    }
}

PowerCreep.prototype.runDeliver = function(scope) {
    let {posStr, res, amt} = scope

    let resAmt = amt || 0

    if (resAmt == 0) {
        if (!this.carry[res]) {
            this.popState()
        }
        else {
            resAmt = this.carry[res]
        }
    }

    let posObj = RoomPosition.parse(posStr)
    let posStruct = posObj.lookFor(LOOK_STRUCTURES)[0]

    if (_.isUndefined(posStruct)) {
        this.popState()
    }

    if (!this.pos.inRangeTo(posObj, 1)) {
        this.pushState('MoveTo', {posStr: posStr})
    }
    else {
        let allowedStructs = [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_CONTAINER, STRUCTURE_LINK, STRUCTURE_STORAGE, STRUCTURE_TERMINAL, STRUCTURE_POWER_SPAWN, STRUCTURE_LAB]
        let targObj = _.find(posObj.lookFor(LOOK_STRUCTURES), s => allowedStructs.includes(s.structureType))

        if (_.isUndefined(targObj)) {
            this.popState()
        }

        let transaction = this.transfer(targObj, res, resAmt)

        let allowedCodes = [0, -6, -7, -8]
        if (allowedCodes.includes(transaction)) {
            this.popState()
        }
    }
}