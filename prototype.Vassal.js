'use strict'

global.VASSAL_MEM = {
    HARVEST_ENERGY: {
        creeps:     {
            haulers:    {},
            miners:     {}
        },
        roads:      {},
    },
    HARVEST_POWER: {
        creeps:     {
            attackers:  {},
            healers:    {},
            haulers:    {}
        }
    },
    HARVEST_MINERAL: {
        creeps:     {
            haulers:    {},
            miners:     {}
        },
        roads:      {},
        containers: {}
    }
}

var Vassal = class {
	constructor(id, scope = {}) {
		this.id = id
        this.scope = Object.assign(scope, VASSAL_MEM[id] || {})
	}
}

Vassal.prototype.HARVEST_ENERGY =   function(scope) {
	let {fromRoom, posStr} = scope

}
Vassal.prototype.HARVEST_POWER =    function(scope) {
    let {fromRoom, posStr, amount, TTL = 5000} = scope

}
Vassal.prototype.HARVEST_MINERAL =  function(scope) {
    let {fromRoom, posStr} = scope

}
Vassal.prototype.BOOTSTRAP_ROOM =   function(scope) {
    let {fromRoom, roomName} = scope

}

Vassal.prototype.invoke = function() {
	let method = `${this.id}`
	this[method](this.scope)
}


let a = new Vassal('Harvest', {toMine: '0101sim', creeps: {}})
console.log(a['Harvest'])
a.invoke()