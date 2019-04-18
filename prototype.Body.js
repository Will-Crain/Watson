'use strict'

class Body extends Array {
	constructor(itr) {
		super(...itr)
	}

	push(part) {
		if (this.length >= MAX_CREEP_SIZE) {
			throw new Error(`Creep body limited to ${MAX_CREEP_SIZE}`)
		}
		return super.push(part)
	}

	cost() {
		return _.sum(this, p => BODYPART_COST[p])
	}

	ticksToSpawn() {
		return this.length * CREEP_SPAWN_TIME
	}

	cycle(n) {
		let arr = []
		for (let i = 0; i < n; i++) {
			arr.push(this[i % this.length])
		}
		return arr
	}

	sort() {
		return _.sortBy(this, s => BODY_ORDER[s])
	}

	repeat(maxSize = MAX_CREEP_SIZE) {
		let n = maxSize / this.length
		return this.cycle(maxSize)
	}
}

module.exports = Body