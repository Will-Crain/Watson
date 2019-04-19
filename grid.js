class Grid {
	constructor(width=50, height=50) {
		this.width = width-1
		this.height = height-1
		this.data = {}
	}

	set(x, y, val) {
		if (x > this.width || y > this.height || x < 0 || y < 0) {
			throw new RangeError('Out of bounds')
		}

		let sX = x.addLeadingZeros(2)
		let sY = y.addLeadingZeros(2)
		let pIndex = `${sX}${sY}`

		this.data[pIndex] = val
		return this
	}

	get(x, y) {
		let sX = x.addLeadingZeros(2)
		let sY = y.addLeadingZeros(2)
		let pIndex = `${sX}${sY}`

		return this.data[pIndex]
	}

	toString() {
		return JSON.stringify(this.data)
	}
}

class RoomGrid {
	constructor(width=50, height=50) {
		this.width = width-1
		this.height = height-1
		this.data = []
	}

	set(x, y, val) {
		if (x > this.width || y > this.height || x < 0 || y < 0) {
			throw new RangeError('Out of bounds')
		}

		let pIndex = Number(this.width*y + x)

		this.data[pIndex] = val
		return this
	}

	get(x, y) {
		let pIndex = Number(this.width*y + x)
		return this.data[pIndex]
	}

	toString() {
		return JSON.stringify(this.data)
	}
}

module.exports = [Grid, RoomGrid]
