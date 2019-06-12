'use strict'

Creep.prototype.runMoveTo = function(scope) {    
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
			this.moveTo(posObj, {range: range, ignoreCreeps: ignoreCreeps})
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
					this.moveTo(posObj, {range: range, ignoreCreeps: ignoreCreeps, maxRooms: 1})
				}
			}
		}
	}
}

Creep.prototype.runManage = function(scope) {
	let {} = scope

	if (_.isUndefined(this.memory.standPosStr)) {
		this.memory.standPosStr = RoomPosition.serialize(RoomPosition.parse(this.room.memory.Bunker).add(0, -1))
	}

	let standPos = RoomPosition.parse(this.memory.standPosStr)

	if (!this.pos.inRangeTo(standPos, 0)) {
		this.pushState('MoveTo', {posStr: this.memory.standPosStr, range: 0})
	}
	else {

		let terminal =      this.room.terminal
		let storage =       this.room.storage
		let powerSpawn =    _.first(this.room.find(FIND_MY_STRUCTURES, {filter: s => s.structureType == STRUCTURE_POWER_SPAWN}))
		let coreLink =      _.find(RoomPosition.parse(this.room.memory.Bunker).lookFor(LOOK_STRUCTURES), s => s.structureType == STRUCTURE_LINK)
		let nuker =         _.first(this.room.find(FIND_MY_STRUCTURES, {filter: s => s.structureType == STRUCTURE_NUKER}))

		if (_.isUndefined(terminal) || _.isUndefined(storage)) {
			return false
		}

		let deficit = {}
		let surplus = {}

		for (let i in DESIRED_RESOURCES) {
			if ((storage.store[i] || 0) < DESIRED_RESOURCES[i]) {
				deficit[i] = DESIRED_RESOURCES[i] - (storage.store[i] || 0)
			}
		}

		for (let i in storage.store) {
			if ((DESIRED_RESOURCES[i] || 0) < storage.store[i]) {
				surplus[i] = storage.store[i] - (DESIRED_RESOURCES[i] || 0)
			}
		}

		if (!_.isUndefined(coreLink) && coreLink.energy < coreLink.energyCapacity && _.has(surplus, 'energy')) {
			let takePos = 	RoomPosition.serialize(storage.pos)
			let storePos = 	RoomPosition.serialize(coreLink.pos)
			let amt = Math.min(coreLink.energyCapacity - coreLink.energy, this.carryCapacity - _.sum(this.carry))

			this.pushState('Deliver', {takePos: takePos, storePos: storePos, res: RESOURCE_ENERGY, amt: amt})
			return
		}

		if (!_.isUndefined(powerSpawn) && powerSpawn.energy < powerSpawn.energyCapacity * 0.3 && terminal.store.energy > 0) {
			let takePos = 	RoomPosition.serialize(terminal.pos)
			let storePos = 	RoomPosition.serialize(powerSpawn.pos)
			let amt = Math.min(powerSpawn.energyCapacity - powerSpawn.energy, this.carryCapacity - _.sum(this.carry))

			this.pushState('Deliver', {takePos: takePos, storePos: storePos, res: RESOURCE_ENERGY, amt: amt})
			return
		}
		if (!_.isUndefined(powerSpawn) && powerSpawn.energy < powerSpawn.energyCapacity * 0.3 && storage.store.energy > DESIRED_RESOURCES.energy*0.9) {
			let takePos = 	RoomPosition.serialize(storage.pos)
			let storePos = 	RoomPosition.serialize(powerSpawn.pos)
			let amt = Math.min(powerSpawn.energyCapacity - powerSpawn.energy, this.carryCapacity - _.sum(this.carry))

			this.pushState('Deliver', {takePos: takePos, storePos: storePos, res: RESOURCE_ENERGY, amt: amt})
			return
		}

		if (!_.isUndefined(powerSpawn) && powerSpawn.power < powerSpawn.powerCapacity * 0.3 && _.has(storage.store, 'power')) {
			let takePos = 	RoomPosition.serialize(storage.pos)
			let storePos = 	RoomPosition.serialize(powerSpawn.pos)
			let amt = Math.min(powerSpawn.powerCapacity - powerSpawn.power, this.carryCapacity - _.sum(this.carry))

			this.pushState('Deliver', {takePos: takePos, storePos: storePos, res: RESOURCE_POWER, amt: amt})
			return
		}

		// presently, this fails if terminal is full
		if (_.keys(surplus).length > 0) {

			let takePos = 	RoomPosition.serialize(storage.pos)
			let storePos =	RoomPosition.serialize(terminal.pos)
			let res = 		_.max(_.keys(surplus), s => surplus[s])
			let amt = 		Math.min(surplus[res], this.carryCapacity - _.sum(this.carry))

			this.pushState('Deliver', {takePos: takePos, storePos: storePos, res: res, amt: amt})
			return
		}

		if (_.keys(deficit).length > 0) {
			let metDemand = {}
			for (let i in deficit) {
				if ((terminal.store[i] || 0) > 0) {
					metDemand[i] = terminal.store[i]
				}
			}

			if (_.keys(metDemand).length > 0) {
				
				let takePos = 	RoomPosition.serialize(terminal.pos)
				let storePos =	RoomPosition.serialize(storage.pos)
				let res = _.max(_.keys(metDemand), s => metDemand[s])
				let amt = Math.min(metDemand[res], this.carryCapacity - _.sum(this.carry))

				this.pushState('Deliver', {takePos: takePos, storePos: storePos, res: res, amt: amt})
			}

		}

	}

}

Creep.prototype.runDeliver = function(scope) {
	let {takePos, storePos, res, amt} = scope
	let allowedStructs = [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_CONTAINER, STRUCTURE_LINK, STRUCTURE_STORAGE, STRUCTURE_TERMINAL, STRUCTURE_POWER_SPAWN, STRUCTURE_LAB]

	if (_.isUndefined(this.memory.state)) {
		this.memory.state = 0
	}
	if (this.memory.state === 0) {
		// take phase
		let resAmt = amt - (this.carry[res] || 0) || (this.carryCapacity - _.sum(this.carry) - (this.carry[res] || 0))

		if ((this.carry[res] && this.carry.res >= resAmt) || resAmt <= 0) {
			this.memory.state = 1
			return
		}

		let posObj = RoomPosition.parse(takePos)
		let posStruct = posObj.lookFor(LOOK_STRUCTURES)[0]

		if (_.isUndefined(posStruct)) {
			this.popState()
		}

		if (!this.pos.inRangeTo(posObj, 1)) {
			this.pushState('MoveTo', {posStr: takePos})
		}
		else {
			let targObj = _.find(posObj.lookFor(LOOK_STRUCTURES), s => allowedStructs.includes(s.structureType))

			if (_.isUndefined(targObj)) {
				this.popState()
			}

			let transaction = this.withdraw(targObj, res, resAmt)
			let allowedCodes = [0, -6, -7, -8]
			if (allowedCodes.includes(transaction)) {
				this.memory.state = 1
			}
		}
	}
	else if (this.memory.state === 1) {
		// store phase
		let posObj = RoomPosition.parse(storePos)
		
		if (!this.pos.inRangeTo(posObj, 1)) {
			this.pushState('MoveTo', {posStr: storePos})
		}
		else {
			let targObj = _.find(posObj.lookFor(LOOK_STRUCTURES), s => allowedStructs.includes(s.structureType))

			if (_.isUndefined(targObj)) {
				this.popState()
			}

			let resAmt = this.carry[res]

			if (res == RESOURCE_ENERGY) {
				if (ENERGY_STRUCTURES.includes(targObj.structureType)) {
					resAmt = Math.min(resAmt, targObj.energyCapacity - targObj.energy)
				}
			}
			else if (res == RESOURCE_POWER) {
				if (POWER_STRUCTURES.includes(targObj.structureType)) {
					resAmt = Math.min(resAmt, targObj.powerCapacity - targObj.power)
				}
			}
			else if (res == RESOURCE_GHODIUM) {
				if (GHODIUM_STRUCTURES.includes(targObj.structureType)) {
					resAmt = Math.min(resAmt, targObj.ghodiumCapacity - targObj.ghodium)
				}
			}

			let transaction = this.transfer(targObj, res, resAmt)
			let allowedCodes = [0, -6, -7, -8]
			if (allowedCodes.includes(transaction)) {
				this.memory.state = undefined
				this.popState()
			}
		}
	}
}

Creep.prototype.runBoost = function(scope) {
	let {type, posStr} = scope
	let posObj = RoomPosition.parse(posStr)

	if (this.pos.inRangeTo(posObj, 1)) {
		let lab = _.find(posObj.lookFor(LOOK_STRUCTURES), s => s.structureType == STRUCTURE_LAB)
		lab.boostCreep(this)
		this.popState()
	}
	else {
		this.pushState('MoveTo', {posStr: posStr})
	}
}

Creep.prototype.runUpgrade = function(scope) {
	let {roomName = this.memory.homeRoom, cont} = scope

	let posObj = Game.rooms[roomName].controller
	let posStr = RoomPosition.serialize(posObj.pos)
	
	if (this.carry.energy == 0) {
		if (cont == true) {

			let boosted = _.any(this.body, s => s.boost)
			if (boosted == false) {
				let getBoost = posObj.pos.findClosestByRange(FIND_STRUCTURES, {filter: s => s.structureType == STRUCTURE_LAB && s.mineralAmount >= 30})
				if (!_.isNull(getBoost)) {
					this.pushState('Boost', {type: 'XGH2O', posStr: RoomPosition.serialize(getBoost.pos)})
				}
			}

			let getTake = posObj.pos.findClosestByRange(FIND_STRUCTURES, {filter: s => s.structureType == STRUCTURE_CONTAINER})
			if (!_.isNull(getTake)) {
				this.pushState('PickUp', {posStr: RoomPosition.serialize(getTake.pos), res: RESOURCE_ENERGY})
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
		
		if (addSources == true && _.isUndefined(this.memory.added)) {
			this.pushState('NoRespawn', {})
			this.memory.added = true
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
				this.pushState('MoveTo', {posStr: RoomPosition.serialize(this.room.controller.pos), ignoreCreeps: true})
			}
		}
	}
}

Creep.prototype.runTrample = function(scope) {
	let {} = scope

	let conSites = this.room.find(FIND_HOSTILE_CONSTRUCTION_SITES, {filter: s => s.pos.lookFor(LOOK_CREEPS).length == 0 && s.pos.lookFor(LOOK_STRUCTURES).length == 0})
	if (conSites.length > 0) {
		let tConSite = this.pos.findClosestByRange(conSites)
		this.pushState('MoveTo', {posStr: RoomPosition.serialize(tConSite.pos), range: 0})
	}
	else {
		this.pushState('Wait', {until: Game.time+10})
	}
}

Creep.prototype.runFillExtensions = function(scope) {
	let {path = false, exit = false} = scope
	
	if (path == false) {
		if (this.room.energyAvailable < this.room.energyCapacityAvailable) {
			
			if (_.sum(this.carry) == 0) {
				let takeFrom = this.room.getTake()
				
				if (takeFrom == false) {
					let allowed = ['storage', 'container', 'terminal']
					let toFind = _.find(this.room.find(FIND_STRUCTURES), s => (allowed.includes(s.structureType)) &&  s.store.energy > 0 )
					if (_.isUndefined(toFind)) {
						this.pushState('Wait', {until: Game.time+10})
					}
					else {
						this.pushState('PickUp', {posStr: RoomPosition.serialize(toFind.pos), res: RESOURCE_ENERGY})
					}
				}
				else {
					this.say(this.pushState('PickUp', {posStr: this.room.getTake(), res: RESOURCE_ENERGY}))
				}
			}
			else {
				let fill = [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER]
				let toFill = this.room.find(FIND_STRUCTURES, {filter: s => fill.includes(s.structureType) && s.energy < s.energyCapacity})
				
				if (toFill.length == 0) {
					this.pushState('Wait', {until: Game.time+3})
				}
				else {
					let posStr = RoomPosition.serialize(this.pos.findClosestByRange(toFill).pos)
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
		if (pickUp == false) {
			this.pushState('Wait', {until: Game.time+3})
		}
		else {
			this.pushState('PickUp', {posStr: pickUp})
		}
	}
	else {
		let posObj = RoomPosition.parse(posStr)
		let noRepair = ['rampart', 'constructedWall']
		let struct = _.find(posObj.lookFor(LOOK_STRUCTURES), s => !noRepair.includes(s.structureType) && this.getRepairPower() <= (s.hitsMax - s.hits))
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

Creep.prototype.runTemp = function(scope) {
	let {} = scope
	
	let lab = Game.rooms[this.memory.homeRoom].controller.pos.findClosestByRange(FIND_STRUCTURES, {filter: s => s.structureType == STRUCTURE_LAB})

	if (_.sum(this.carry) == 0) {
		if (lab.energy < lab.energyCapacity) {
			let getTake = this.room.getTake('energy')
			this.pushState('PickUp', {posStr: getTake, res: 'energy', amt: lab.energyCapacity - lab.energy})
		}
		else if (lab.mineralAmount < lab.mineralCapacity) {
			let getTake = this.room.getTake('XGH2O')
			if (getTake == false) {
				this.pushState('Wait', {until: Game.time + 10})
				this.pushState('NoRespawn', {})
			}
			this.pushState('PickUp', {posStr: getTake, res: 'XGH2O', amt: lab.mineralCapacity - lab.mineralAmount})
		}
	}
	else {
		this.pushState('DropOff', {posStr: RoomPosition.serialize(lab.pos), res: _.max(_.keys(this.carry), s => this.carry[s])})
	}
	
}

Creep.prototype.runDeliverController = function(scope) {
	let {} = scope
	let homeRoom = Game.rooms[this.memory.homeRoom]
	let storeTo = homeRoom.controller.pos.findClosestByRange(FIND_STRUCTURES, {filter: s => s.structureType == STRUCTURE_CONTAINER})

	if (_.sum(this.carry) == 0) {
		let takeFrom = homeRoom.getTake(RESOURCE_ENERGY)
		this.pushState('PickUp', {res: RESOURCE_ENERGY, posStr: takeFrom})
	}
	else {

		if (_.isUndefined(storeTo)) {
			//cry
		}
		else {
			this.pushState('DropOff', {res: RESOURCE_ENERGY, posStr: RoomPosition.serialize(storeTo.pos)})
		}
	}
}

Creep.prototype.runFindRepair = function(scope) {
	let {} = scope
	let homeRoom = Game.rooms[this.memory.homeRoom]
	
	if (_.sum(this.carry) == 0) {
		let pickUp = homeRoom.getTake(RESOURCE_ENERGY)
		if (pickUp !== false) {
			this.pushState('PickUp', {posStr: pickUp})
		}
		else {
			this.pushState('FindBuild', {})
		}
	}
	else {
		let toRepair = []
		let noRepair = ['construtedWall', 'rampart', 'controller']

		for (let i in homeRoom.memory.mineRooms) {
			if (_.isUndefined(Game.rooms[i])) {
				continue
			}
			let addTo = Game.rooms[i].find(FIND_STRUCTURES, {filter: s => !noRepair.includes(s.structureType) && this.getRepairPower() <= (s.hitsMax -s.hits) && (s.hits/s.hitsMax) <= REPAIR_THRESHOLD_BY_STRUCTURE[s.structureType]})
			toRepair.push(...addTo)
		}

		if (toRepair.length == 0) {
			let toBuild = this.room.find(FIND_CONSTRUCTION_SITES)
			if (toBuild.length > 0) {
				this.pushState('FindBuild', {})
			}
			else {
				let canFortify = ['construtedWall', 'rampart']
				let toFortify = homeRoom.find(FIND_STRUCTURES, {filter: s => canFortify.includes(s.structureType) && s.hits < FORTIFY_THRESHOLD_BY_RCL[homeRoom.controller.level]*0.98})

				// if (toFortify.length > 0) {
				// 	let target = _.min(toFortify, s => s.hits/FORTIFY_THRESHOLD_BY_RCL[homeRoom.controller.level])
				// 	let posStr = RoomPosition.serialize(target.pos)
				// 	this.pushState('Fortify', {posStr: posStr})
				// }
				// else {
					let conPos = RoomPosition.serialize(this.room.controller.pos)
					this.pushState('Upgrade', {posStr:conPos, cont: false})
				// }
			}
		}
		else {
			let repairTarg = _.first(toRepair)
			this.pushState('Repair', {posStr: RoomPosition.serialize(repairTarg.pos)})
		}
	}
}

Creep.prototype.runBuild = function(scope) {
	let {posStr, getPosStr = false, cont = true} = scope
	let posObj = RoomPosition.parse(posStr).lookFor(LOOK_CONSTRUCTION_SITES)[0]
	
	if (_.isUndefined(posObj)) {
		this.popState()
	}
	
	if (this.carry.energy === 0) {
		if (cont == false) {
			this.popState()
			return
		}
		if (getPosStr !== false) {
			this.pushState('PickUp', {posStr: getPosStr, res: RESOURCE_ENERGY})
		}
		else {
			let allowed = ['container', 'storage', 'terminal']
			let container = Game.rooms[this.memory.homeRoom].find(FIND_STRUCTURES, {filter: s => allowed.includes(s.structureType) && s.store.energy > 0})[0]
			if (_.isUndefined(container)) {
				this.popState()
			}
			else {
				this.pushState('PickUp', {posStr: RoomPosition.serialize(container.pos)})
			}
		}
	}
	else {
		if (_.isUndefined(posObj) || _.isNull(posObj)) {
			this.popState()
		}

		if (!this.pos.inRangeTo(RoomPosition.parse(posStr), 3)) {
			this.pushState('MoveTo', {posStr: posStr, range: 3})
		}
		else {
			let bld = this.build(posObj)
			// if (!posObj || posObj.progress == posObj.progressTotal) {
			//     this.popState()
			// }
		}
	}
	
}
Creep.prototype.runFindBuild = function(scope) {
	let {cont = true} = scope
	let homeRoom = Game.rooms[this.memory.homeRoom]

	let conSites = []

	for (let i in homeRoom.memory.mineRooms) {
		if (!_.isUndefined(Game.rooms[i])) {
			conSites.push(...Game.rooms[i].find(FIND_CONSTRUCTION_SITES))
		}
	}

	if (conSites.length == 0) {
		if (cont == false) {
			this.popState()
		}
		else {
			this.pushState('NoRespawn', {})
			this.pushState('Upgrade', {cont: true})
		}
	}
	else {
		let targetSite = _.max(conSites, function(s) {
			let index = `${RoomPosition.serialize(s.pos)}${s.structureType}`
			if (_.isUndefined(homeRoom.memory.structures[index])) {
				return 1
			}
			else if (_.isUndefined(homeRoom.memory.structures[index].priority)) {
				return PRIORITY_BY_STRUCTURE[s.structureType]
			}
			else {
				return homeRoom.memory.structures[index].priority
			}
		})
		let takeFrom = homeRoom.getTake()
		if (takeFrom == false) {
			let allowed = ['container', 'storage', 'terminal']
			let testObj = _.find(this.room.find(FIND_STRUCTURES, {filter: s => allowed.includes(s.structureType) && s.store.energy > 0}))
			if (_.isUndefined(testObj)) {
				// cry
			}
			else {
				takeFrom = RoomPosition.serialize(testObj.pos)
			}
		}
		this.pushState('Build', {posStr: RoomPosition.serialize(targetSite.pos), getPosStr: homeRoom.getTake()})
	}
}

Creep.prototype.runFortify = function(scope) {
	let {posStr} = scope
	let homeRoom = Game.rooms[this.memory.homeRoom]

	if (_.sum(this.carry) == 0) {
		let pickUp = homeRoom.getTake(RESOURCE_ENERGY)
		if (pickUp == false) {
			this.popState()
		}
		else {
			this.pushState('PickUp', {posStr: pickUp})
		}
	}
	else {
		let posObj = RoomPosition.parse(posStr)
		let toFortify = ['rampart', 'constructedWall']
		let targets = posObj.lookFor(LOOK_STRUCTURES)
		let target = _.find(targets, s => s.hits < s.hitsMax && toFortify.includes(s.structureType))
		if (_.isUndefined(target)) {
			this.popState()
		}
		else {
			if (!this.pos.inRangeTo(posObj, 3)) {
				this.pushState('MoveTo', {posStr: posStr, range: 2})
			}
			else {
				this.repair(target)
				if (_.sum(this.carry) - this.getRepairCost() < this.getRepairCost()) {
					this.popState()
				}
			}
		}
	}
}
Creep.prototype.runFindFortify = function(scope) {
	let {} = scope
	let homeRoom = Game.rooms[this.memory.homeRoom]

	let toFortify = ['rampart', 'constructedWall']
	let targets = this.room.find(FIND_STRUCTURES, {filter: s => toFortify.includes(s.structureType) && s.hits < FORTIFY_THRESHOLD_BY_RCL[homeRoom.controller.level]})
	if (targets.length == 0) {
		this.pushState('Wait', {until: Game.time+50})
		this.pushState('AvoidStructures', {})
		// this.pushState('FindRepair')
	}

	let target = _.min(targets, s => s = s.hits)
	this.pushState('Fortify', {posStr: RoomPosition.serialize(target.pos)})
}

Creep.prototype.runHarvest = function(scope) {
	let {posStr, cont = true, roomName = this.memory.homeRoom} = scope
	let homeRoom = Game.rooms[this.memory.homeRoom]
	let posObj = RoomPosition.parse(posStr)

	let targetRoom = Game.rooms[roomName]
	
	// this.pushState('Harvest', {posStr: RoomPosition.serialize(targetSource.pos), cont: false})
	if (_.sum(this.carry) == this.carryCapacity) {
		if (cont == false) {
			this.popState()
			return
		}

		let dropOff = targetRoom.getStore(RESOURCE_ENERGY)
		
		if (dropOff == false) {
			let cSites = this.room.find(FIND_CONSTRUCTION_SITES)
			if (cSites.length > 0) {
				let targetSite = _.max(cSites, s => targetRoom.memory.structures[`${RoomPosition.serialize(s.pos)}${s.structureType}`].priority || PRIORITY_BY_STRUCTURE[s.structureType])
				this.pushState('Build', {posStr: RoomPosition.serialize(targetSite.pos)})
			}
			else {
				this.pushState('Upgrade', {posStr: RoomPosition.serialize(targetRoom.controller.pos), cont: false})
			}
		}
		else {
			this.pushState('DropOff', {posStr: targetRoom.getStore(RESOURCE_ENERGY)})
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
				if (_.isUndefined(targetRoom.memory.mineRooms[this.room.name])) {
					targetRoom.memory.mineRooms[this.room.name] = 0
				}
				targetRoom.memory.mineRooms[this.room.name] += this.getMinePower()
			}
		}
	}
}
Creep.prototype.runMineMineral = function(scope) {
	let {standPosStr, minePosStr} = scope
	let standPos = RoomPosition.parse(standPosStr)
	let roomName = standPos.roomName
	let homeRoom = Game.rooms[this.memory.homeRoom]

	if (!this.pos.inRangeTo(standPos, 0)) {
		this.pushState('MoveTo', {posStr: standPosStr, range: 0})
	}
	else {
		let mineObj = RoomPosition.parse(minePosStr).lookFor(LOOK_MINERALS)[0]
		let extractor = _.find(RoomPosition.parse(minePosStr).lookFor(LOOK_STRUCTURES), s => s.structureType == STRUCTURE_EXTRACTOR)
		if (mineObj.mineralAmount == 0) {
			this.pushState('NoRespawn', {})

			let hauler = _.find(_.keys(homeRoom.memory.Creeps), s => _.last(homeRoom.memory.Creeps[s].baseStack)[1].pickUp == _.last(this.memory.stack)[1].standPosStr)
			if (!_.isUndefined(hauler)) {
				Game.creeps[hauler].pushState('NoRespawn', {})
			}
			homeRoom.memory.minerals[minePosStr].active = false
			homeRoom.memory.minerals[minePosStr].ticks = mineObj.ticksToRegeneration
		}

		if (extractor.cooldown > 0) {
			return
		}

		else {
			let container = _.find(standPos.lookFor(LOOK_STRUCTURES), s => s.structureType == STRUCTURE_CONTAINER)
			if (_.isUndefined(container)) {
				// cry
			}
			else {
				if (_.sum(container.store) >= container.storeCapacity) {
					// cry
				}
				else {
					this.harvest(mineObj)
				}
			}
		}
	}
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
			if (_.sum(this.carry) + energyPerMine > this.carryCapacity && this.carryCapacity > 0) {
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
							Game.rooms[this.memory.homeRoom].memory.mineRooms[this.room.name] += this.getMinePower()
						}
					}
				}
			}
			else {
				let harvestAction = this.harvest(mineObj)
				if (harvestAction == 0) {
					Game.rooms[this.memory.homeRoom].memory.mineRooms[this.room.name] += this.getMinePower()
				}
			}
		}
		else {
			// mope, nothing to mine
		}
	}
}
Creep.prototype.runHaul = function(scope) {
	let {pickUp, dropOff, dist = 20, res = RESOURCE_ENERGY} = scope

	let homeRoom = Game.rooms[this.memory.homeRoom]
	if (this.ticksToLive < dist*2+10) {
		//this.pushState('Recycle', {posStr: spawnPos})
		this.suicide()
	}
	else {
		if (_.sum(this.carry) == 0) {
			this.pushState('PickUp', {posStr: pickUp, res: res})
		}
			
		else {
			let getStore = homeRoom.getStore(res)
			if (getStore !== false) {
				this.pushState('DropOff', {posStr: getStore})
			}
			else {
				this.pushState('Wait', {until: Game.time + 3})
			}
		}
	}
}

Creep.prototype.runRenew = function(scope) {
	let {posStr, minTicks} = scope
	let posObj = RoomPosition.parse(posStr)
		
	if (this.ticksToLive >= minTicks) {
		this.popState()
	}
	else {
	
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
		}
	}
}

Creep.prototype.runPickUp = function(scope) {
	let {posStr, res = RESOURCE_ENERGY, amt = this.carryCapacity - _.sum(this.carry)} = scope

	amt = Math.min(this.carryCapacity - _.sum(this.carry), amt)

	if (posStr == false) {
		this.popState()
		this.pushState('Wait', {until: Game.time+5})
	}
	else {
		let posObj = RoomPosition.parse(posStr)
		
		if (!this.pos.inRangeTo(posObj, 1)) {
			this.pushState('MoveTo', {posStr: posStr})
		}
		else {

			if (_.sum(this.carry) == this.carryCapacity) {
				this.popState()
			}
			else {
				let posStruct = _.first(posObj.lookFor(LOOK_STRUCTURES))
				if (_.isUndefined(posStruct) || _.isNull(posStruct)) {
					let resObj = _.find(posObj.lookFor(LOOK_RESOURCES), s => s.resourceType == res)
					if (_.isUndefined(resObj)) {
						let creepObj = _.find(posObj.lookFor(LOOK_CREEPS), s => s.my && s.carry.energy > 0)
						if (_.isUndefined(creepObj)) {
							this.popState()
						}
						else {
							let state = creepObj.transfer(this, RESOURCE_ENERGY, Math.min(amt, creepObj.carry[res]))
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
					let st = ['container', 'storage', 'terminal']
					let inStore = st.includes(posStruct.structureType) ? posStruct.store[res] : posStruct.energy
					let state = this.withdraw(posStruct, res, Math.min(amt, inStore))
					if (state == 0 || _.sum(this.carry) == this.carryCapacity || state == -6) {
						this.popState()
					}
				}
			}
		}
	}
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
				return 2
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
			let meCreep = Game.rooms[this.memory.homeRoom].memory.Creeps[this.name]
			if (_.isUndefined(meCreep)) {
				// cry
			}
			else {
				meCreep.removeOnDeath = true
				this.pushState('Wait', {until: Game.time+100})
			}
		}
		else {
			let target = _.min(hostileCreeps, s => s.getHealing())
			this.pushState('AttackMove', {targetID: target.id})
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
		let noKill = ['container', 'controller', 'road', 'constructedWall', 'rampart']
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
				this.moveTo(targetObj)
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

Creep.prototype.runBootstrap = function(scope) {
	let {roomName} = scope
	if (this.room.name !== roomName) {
		let route = Game.map.findRoute(this.room, roomName, {routeCallback(rName, frName) {
			if (Room.describe(rName) == 'SOURCE_KEEPER' || Room.describe(frName) == 'CENTER') {
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
		if (_.sum(this.carry) == 0) {
			let sources = this.room.find(FIND_SOURCES, {filter: s => s.energy > 0})
			let targetSource = this.pos.findClosestByRange(sources)
			this.pushState('Harvest', {posStr: RoomPosition.serialize(targetSource.pos), cont: false})
		}
		else {
			if (this.room.controller.ticksToDowngrade < 5000) {
				this.pushState('Upgrade', {roomName: roomName, cont: false})
			}
			else {
				// Is spawn built?
				let targetRoom = Game.rooms[roomName]
				let conSites = targetRoom.find(FIND_MY_CONSTRUCTION_SITES)
				let targetSite = _.max(conSites, s => PRIORITY_BY_STRUCTURE[s.structureType] || 10)
				if (conSites.length != 0) {
					this.pushState('Build', {posStr: RoomPosition.serialize(targetSite.pos), cont: false})
				}
				else {
					let spawnObj = Game.rooms[roomName].find(FIND_STRUCTURES, {filter: s => s.structureType == STRUCTURE_SPAWN})[0]
					if (this.room.controller.level > 2) {
						this.pushState('Upgrade', {roomName: roomName, cont: false})
						this.pushState('NoRespawn', {})
					}
					else {
						if (this.ticksToLive <= 200 && !_.isUndefined(spawnObj)) {
							this.pushState('Renew', {posStr: RoomPosition.serialize(spawnObj.pos), minTicks: 800})
						}
						else {
							this.pushState('Upgrade', {roomName: roomName, cont: false})
						}

					}
				}
			}
		}
	}
}
Creep.prototype.runClaim = function(scope) {
	let {roomName} = scope
	if (this.room.name !== roomName) {
		let route = Game.map.findRoute(this.room, roomName, {routeCallback(rName, frName) {
			if (Room.describe(rName) == 'SOURCE_KEEPER' || Room.describe(frName) == 'CENTER') {
				return 50
			}
			else if (Room.describe(rName) == 'HIGHWAY') {
				return 3
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
		if (this.pos.inRangeTo(this.room.controller, 1)) {
			let creepAction = this.claimController(this.room.controller)

			if (creepAction == 0) {
				let structs = this.room.find(FIND_STRUCTURES)
				for (let i in structs) {
					structs[i].destroy()
				}
				let bunkerPos = Game.rooms[roomName].populateMatrix()

				if (bunkerPos == false) {
					this.room.controller.unclaim()
					this.suicide()
					// cry
				}
				else {                    
					Game.rooms[this.memory.homeRoom].addCreep('HELPER', [['Bootstrap', {roomName: roomName}]])
					Game.rooms[this.memory.homeRoom].addCreep('HELPER', [['Bootstrap', {roomName: roomName}]])

					this.pushState('Wait', {until: Game.time+this.ticksToLive})
					this.pushState('NoRespawn', {})
				}
			}
			else {
				this.pushState('NoRespawn', {})
				// cry
			}

		}
		else {
			this.pushState('MoveTo', {posStr: RoomPosition.serialize(this.room.controller.pos)})
		}
	}
}
Creep.prototype.runReserve = function(scope) {
	let {roomName, message = `The fuel for ${this.memory.homeRoom}`} = scope
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
		if (this.pos.inRangeTo(this.room.controller, 1)) {
			if (_.isUndefined(this.room.controller.sign) || this.room.controller.sign.text !== message) {
				this.signController(this.room.controller, message)
			}
			else {
				this.reserveController(this.room.controller)
			}
		}
		else {
			let conAdj = this.room.controller.pos.getAdjacent()
			let cPosStr = false
	
			for (let i in conAdj) {
				let adjPos = RoomPosition.parse(conAdj[i])
				if (adjPos.lookFor(LOOK_STRUCTURES).length == 0) {
					cPosStr = conAdj[i]
				}
			}
			
			if (cPosStr == false) {
				this.pushState('MoveTo', {posStr: RoomPosition.serialize(this.room.controller.pos), range: 1})
			}
			else {
				this.pushState('MoveTo', {posStr: cPosStr, range: 0})

			}
		}
	}

}

Creep.prototype.runAvoidStructures = function(scope) {
    let {} = scope

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

//      //      //      //      //      //      //      //      //      //

//      //      //      //      //      //      //      //      //      //

Creep.prototype.runRecycle = function(scope) {
	let {posStr} = scope
	let posObj = RoomPosition.parse(posStr)
	
	if (!this.pos.inRangeTo(posObj, 1)) {
		this.pushState('MoveTo', {posStr: posStr})
	}
	else {
		posObj.recycleCreep(this)
	}
	
}

Creep.prototype.runDropOff = function(scope) {
	let {posStr, cont = true} = scope
	
	if (posStr == false) {
		this.pushState('Wait', {until: Game.time+5})
	}
	let posObj = RoomPosition.parse(posStr)
	
	if (!this.pos.inRangeTo(posObj, 1)) {
		this.pushState('MoveTo', {posStr: posStr})
	}
	else {
		if (_.sum(this.carry) == 0) {
			this.popState()
		}
		else {
			let allowed = [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER, STRUCTURE_CONTAINER, STRUCTURE_LINK, STRUCTURE_STORAGE, STRUCTURE_TERMINAL, STRUCTURE_POWER_SPAWN, STRUCTURE_LAB]
			let targObj = _.find(posObj.lookFor(LOOK_STRUCTURES), s => allowed.includes(s.structureType))

			if (_.isUndefined(targObj)) {
				this.popState()
			}
			
			let transAction = this.transfer(targObj, _.max(_.keys(this.carry), s => this.carry[s]))
			if (transAction == -8 || transAction == 0) {
				this.popState()
			}
		}
	}
}

Creep.prototype.runNoRespawn = function(scope) {
	let {} = scope
	let meCreep = Game.rooms[this.memory.homeRoom].memory.Creeps[this.name]
	if (_.isUndefined(meCreep)) {
		this.suicide()
		// cry
	}
	else {
		meCreep.removeOnDeath = true
	}
	this.popState()
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
		sum += mults[bst] * healParts[bst] * 12
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

Creep.prototype.getRepairCost = function() {
	return _.sum(this.body, s => s.type == WORK)
}