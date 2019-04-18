'use strict'

RoomVisual.drawLineText = function(rName, x, y, text, indents=0) {
    let RV = new RoomVisual(rName)
    RV.text(text, x+(indents*0.5), y, {font: 0.4, align: 'left'})
    
    return [x, y+0.5]
}

RoomVisual.drawRange = function(posStr, r) {
    let posObj = RoomPosition.deSerPos(posStr)
    let rName = posObj.roomName
    
    new RoomVisual(rName).rect(posObj.x-r-0.5, posObj.y-r-0.5, r*2+1, r*2+1, {opacity: 0.1})
}

RoomVisual.showRoom = function(obj) {
    let currX = 1
    let currY = 1
    let res = []
    
    res = RoomVisual.drawLineText(obj.name, currX, currY, obj.name, 0)
    currX = res[0]
    currY = res[1]
    
    if (obj.memory.queue.length == 0) {
        res = RoomVisual.drawLineText(obj.name, currX, currY, 'Spawn: Empty', 1)
    }
    else {
        res = RoomVisual.drawLineText(obj.name, currX, currY, `Spawn: ${obj.memory.queue}`, 1)
    }
    currX = res[0]
    currY = res[1]
    
    if (obj.memory.buildQueue.length == 0) {
        res = RoomVisual.drawLineText(obj.name, currX, currY, 'Build: Empty', 1)
    }
    else {
        let outstr = ''
        let countedBy = _.countBy(obj.memory.buildQueue, s => obj.memory.structures[s].structureType)
        
        for (let i in countedBy) {
            outstr += `${i}: ${countedBy[i]}`
        }
        res = RoomVisual.drawLineText(obj.name, currX, currY, `Build: ${outstr}`, 1)
    }
    currX = res[0]
    currY = res[1]
    
    for (let i in obj.memory.stack) {
        res = RoomVisual.drawLineText(obj.name, currX, currY, `${obj.memory.stack[i][0]}`, 1)
        currX = res[0]
        currY = res[1]
    }
    
    for (let i in obj.memory.Creeps) {
        if (Game.creeps[i] != undefined) {
            res = RoomVisual.drawLineText(obj.name, currX, currY, i, 0)
            currX = res[0]
            currY = res[1]
        
            for (let v in Game.creeps[i].memory.stack) {
                res = RoomVisual.drawLineText(obj.name, currX, currY, `${Game.creeps[i].memory.stack[v][0]}`, 1)
                currX = res[0]
                currY = res[1]
                
            }
        }
    }
}

RoomVisual.drawGrid = function(grid, roomName) {
    let RV = new RoomVisual(roomName)

    let valueMax = _.max(_.values(grid))
    let valueMin = 0
    
    for (let i in grid) {
        let x = Number(i.substr(0, 2))
        let y = Number(i.substr(2, 2))

        let colorMax = 0.7
        let colorMin = 0

        let h = (grid[i]/valueMax) * ( (colorMax - colorMin) + colorMin)
        let s = 1
        let l = 0.6
        let hexColor = HSL_TO_HEX(h, s, l)
        RV.rect(x-0.5, y-0.5, 1, 1, {fill: hexColor, opacity: 0.3})
        RV.text(grid[i], x, y+0.25, {stroke: '#000000', color: '#ffffff', opacity: 0.3})
    }
}
