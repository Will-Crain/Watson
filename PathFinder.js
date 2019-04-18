'use strict'

PathFinder.serialize = function(path) {
    let outstr = ''
    let currRoom = ''
    for (let i in path) {
        if (path[i].roomName !== currRoom) {
            outstr += `-${path[i].roomName}-`
            currRoom = path[i].roomName
        }
        outstr += Number(path[i].x).addLeadingZeros(2)
        outstr += Number(path[i].y).addLeadingZeros(2)
    }
    
    return outstr
}

PathFinder.parse = function(pathStr) {
	let path = []
	let pattern = /\w+/g
	let rooms = []
	let paths = []
	
	let matches = pathStr.match(pattern)
	_.forEach(matches, function(v, k) {
        if (k%2==0) {
            rooms.push(v)
        }
        else {
            paths.push(v)
        }
	})
	
	for (let i in rooms) {
        for (let v = 0; v < paths[i].length/4; v++) {
            let substr = paths[i].substr(v*4, v*4+4)
            let posStr = `${substr.substr(0, 2)}${substr.substr(2, 3)}${rooms[i]}`
            path.push(posStr)
        }
	}

    return path
}
