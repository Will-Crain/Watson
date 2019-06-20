global.HSL_TO_RGB = function(h, s, l)  {
	let r, g, b
	if (s == 0) {
			r = g = b = l
	}
	else {
		function hue2rgb(p, q, t) {
					
			if (t < 0) t++
			if (t > 1) t--
			if (t < 1/6) return p + (q-p) * 6 * t
			if (t < 1/2) return q
			if (t < 2/3) return p + (q-p) * (2/3 - t) * 6
			return p
		}
			
			let q = l < 0.5 ? l * (1 + s) : l + s - l*s
			let p = 2 * l - q
			
			r = hue2rgb(p, q, h + 1/3)
			g = hue2rgb(p, q, h)
			b = hue2rgb(p, q, h - 1/3)
	}
	return [Math.round(r*255), Math.round(g * 255), Math.round(b * 255)]
}

global.RGB_TO_HEX = function(rgb) {
	let [r,g,b] = rgb
	r = r.toString(16)
	g = g.toString(16)
	b = b.toString(16)
	return '#' + r + g + b
}

global.HSL_TO_HEX = function(h, s, l) {
	let RGB = HSL_TO_RGB(h, s, l)
	let HEX = RGB_TO_HEX(RGB)
	return HEX
}

global.GET_RES = function(lookObj, res) {
	let [type, obj] = _.values(lookObj)
	
	// check if `type` is valid
	let allowedTypes = ['creep', 'energy', 'resource', 'tombstone', 'powerCreep', 'structure']
	if (!allowedTypes.includes(type)) {
		return 0
	}

	// specific properties
	let types = {
		creep:		'carry',
		structure:	'store',
		tombstone:	'store',
		powerCreep:	'carry'
	}

	let targetProperty = _.has(types, type) ? `${types[type]}.${res}` : (obj['resourceType'] == res ? `amount` : 0)
	console.log(targetProperty)
	return _.get(obj, targetProperty) || 0
}

global.PROFILE = function() {
    let avgCPU = _.sum(Memory.cpuUsage)/Memory.cpuUsage.length
    let numCreeps = _.sum(Memory.rooms, s => _.keys(s.Creeps).length)
    let numRooms = _.sum(Game.rooms, s => s.controller && s.controller.my)
    console.log(`CPU:\t${avgCPU.toFixed(2)} CPU over the last ${Memory.cpuUsage.length} ticks\n\t${ (avgCPU/numCreeps).toFixed(2)} CPU per Creep\n\t${ (avgCPU/numRooms).toFixed(2)} CPU per Room`)
}

Room.prototype.getAverageRampart = function() {
	let ramparts = this.find(FIND_STRUCTURES, {filter: s => s.structureType == STRUCTURE_RAMPART})
	let sum = 0
	let count = 0
	let min = 300e9
	let max = 0

	for (let i in ramparts) {
		sum += ramparts[i].hits
		count += 1
		if (ramparts[i].hits < min) {
			min = ramparts[i].hits
		}
		if (ramparts[i].hits > max) {
			max = ramparts[i].hits
		}
	}

	console.log(`AVG:\t${(sum/count).toFixed(2)}\nMIN:\t${min}\nMAX\t${max}`)
}