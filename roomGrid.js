class RoomGrid {
	constructor(width=50, height=50) {
		this.width = width
		this.height = height
        this.data = []
        this.structures = []
	}

	set(x, y, val) {
		if (x > this.width-1 || y > this.height-1 || x < 0 || y < 0) {
			throw new RangeError('Out of bounds')
		}

		let pIndex = Number(this.width*y) + Number(x)

		this.data[pIndex] = val
		return this
    }
    
    setStructure(x, y, val) {
		if (x > this.width-1 || y > this.height-1 || x < 0 || y < 0) {
			throw new RangeError('Out of bounds')
		}

		let pIndex = Number(this.width*y) + Number(x)

		this.structures[pIndex] = val
		return this
    }

	get(x, y) {
		let pIndex = Number(this.width*y) + Number(x)
		return this.data[pIndex]
	}

	toString() {
		return JSON.stringify(this.data)
	}
}

module.exports = RoomGrid