'use strict'

global.OVERMIND_ROOMS_CLEANSED = 5

global.DIRECTIONS = {
    1: [0, -1],
    2: [1, -1],
    3: [1, 0],
    4: [1, 1],
    5: [0, 1],
    6: [-1, 1],
    7: [-1, 0],
    8: [-1, -1]
}

global.BODY_ORDER = ['tough', 'move', 'carry', 'work', 'ranged_attack', 'attack', 'claim', 'heal']

global.RECURSION_DEPTH = 5
global.CREEP_COUNT = 1e6

global.ME =                 'engineeryo'
global.ALLIANCE_PLAYERS =   []
global.FRIEND_PLAYERS =     []
global.HOSTILE_PLAYERS =    ['k-c']

global.PRIORITY_BY_ROLE = {
	ENERGY_GATHERER: 	2,
	SCOUT:				5,
	ANKLE_DISMANTLER:	4,
	ANKLE_BITER:		4,
	DEFENSE_RANGED:		4,
	DEFENSE_MELEE:		3,
	MOBILE_UPGRADER:	3,
	EXTENSIONER:		0.5,
	REPAIRER:			4,
	BUILDER:			4,
	RESERVER:			4,
	CLAIMER:			4,
	CONTROLLER_FILLER:	4
}

global.PRIORITY_BY_STRUCTURE = {
    'spawn':        99,
    'extension':    20,
    'road':         10,
    'wall':         3,
    'rampart':      5,
    'link':         30,
    'storage':      98,
    'tower':        90,
    'observer':     80,
    'power_spawn':  97,
    'extractor':    80,
    'lab':          60,
    'terminal':     96,
    'container':    21,
    'nuker':        25
}

global.REPAIR_THRESHOLD_BY_STRUCTURE = {
    'spawn':        0.99,
    'extension':    0.95,
    'road':         0.75,
    'wall':         0.1,
    'rampart':      0.1,
    'link':         0.96,
    'storage':      0.98,
    'tower':        0.98,
    'observer':     0.95,
    'power_spawn':  0.99,
    'extractor':    0.95,
    'lab':          0.95,
    'terminal':     0.98,
    'container':    0.8,
    'nuker':        0.95

}

global.MAX_STACK_LENGTH = 100

global.BODIES = {

	// Reserves and claims rooms
	RESERVER:			[MOVE, CLAIM, MOVE, CLAIM],
	CLAIMER:			[MOVE, MOVE, MOVE, MOVE, MOVE, CLAIM],

    // Mobile energy miner
	ENERGY_GATHERER:    [MOVE, CARRY, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, CARRY, MOVE, CARRY],
	
	SCOUT:				[MOVE],

	// Small attackers
	ANKLE_DISMANTLER:	[MOVE, WORK, MOVE, WORK],
	ANKLE_BITER:		[MOVE, ATTACK, MOVE, ATTACK],

	// Defenders
	DEFENSE_RANGED:		[MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK, MOVE, RANGED_ATTACK],
	DEFENSE_MELEE:		[MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK],
    
    // Early RCL mobile upgrader
	MOBILE_UPGRADER:    [MOVE, CARRY, MOVE, WORK, MOVE, CARRY, WORK, MOVE, CARRY, MOVE, WORK, MOVE, WORK, MOVE, WORK],
	STATIC_UPGRADER:    [MOVE, CARRY, WORK, WORK, MOVE, CARRY, WORK, WORK, MOVE, CARRY, WORK, WORK, MOVE, CARRY, WORK, WORK, MOVE, CARRY, WORK, WORK],
    
	// Static energy miner
	ENERGY_MINER:       [MOVE, WORK, CARRY, MOVE, WORK, WORK, MOVE, WORK, WORK],
	
	// Hauler of any kind
	HAULER:             [MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY],
	CONTROLLER_FILLER:	[MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY],
	
    // Energy manager around extensions
	EXTENSIONER:        [MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY],

	// Repairs things
	REPAIRER:			[MOVE, CARRY, MOVE, WORK, MOVE, CARRY, MOVE, CARRY, MOVE, WORK, MOVE, CARRY, MOVE, CARRY, MOVE, WORK, MOVE, CARRY, MOVE, CARRY, MOVE, WORK, MOVE, CARRY, MOVE, CARRY, MOVE, WORK, MOVE, CARRY],

	// Builds things
	BUILDER:			[MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK]
}

global.REVERSE_DIRECTION = {
    1: BOTTOM,
    2: BOTTOM_LEFT,
    3: LEFT,
    4: TOP_LEFT,
    5: TOP,
    6: TOP_RIGHT,
    7: RIGHT,
    8: BOTTOM_RIGHT
}

global.Bunker = '{"1":{"+00+02":"spawn"},"2":{"-03+03":"extension","-03+02":"extension","-04+02":"extension","-02+03":"extension","-02+04":"extension"},"3":{"+02+04":"extension","+02+03":"extension","+03+03":"extension","+03+02":"extension","+04+02":"extension","+00+03":"tower"},"4":{"-05+03":"extension","-05+04":"extension","-04+04":"extension","-04+05":"extension","-03+05":"extension","+03+05":"extension","+04+05":"extension","+04+04":"extension","+05+04":"extension","+05+03":"extension","+00+01":"road","+01+00":"road","+00-01":"road","-01+00":"road","-01+03":"road","+01+03":"road","-01+04":"road","-02+05":"road","-03+04":"road","-04+03":"road","-05+02":"road","-04+01":"road","-03+01":"road","-02+02":"road","+02+02":"road","+03+01":"road","+04+01":"road","+05+02":"road","+04+03":"road","+03+04":"road","+02+05":"road","+01+04":"road","+01-02":"storage"},"5":{"+00+00":"link","+00-03":"tower","-01-03":"road","+01-03":"road","+03+00":"extension","+04+00":"extension","-03+00":"extension","-04+00":"extension","-05+01":"extension","-06+01":"extension","-06+02":"extension","+05+01":"extension","+06+01":"extension","+06+02":"extension"},"6":{"+01+05":"extension","+01+06":"extension","+02+06":"extension","-01+05":"extension","-01+06":"extension","-02+06":"extension","+05-01":"extension","+06-01":"extension","-05-01":"extension","-06-01":"extension","-05+00":"road","-06+00":"road","-04-01":"road","-03-01":"road","+05+00":"road","+06+00":"road","+04-01":"road","+03-01":"road","-01-02":"terminal","+03+06":"road","+04+06":"road","+05+05":"road","+06+04":"road","+06+03":"road","-03+06":"road","-04+06":"road","-05+05":"road","-06+04":"road","-06+03":"road","+00+05":"road","+00+06":"road"},"7":{"-02+00":"spawn","-02-02":"road","+02-02":"road","+01-04":"road","-01-04":"road","+00-05":"road","+00-06":"road","+05-03":"extension","+05-04":"extension","+04-04":"extension","+04-05":"extension","+03-05":"extension","-02+01":"tower","-04-03":"road","-03-04":"road","-02-05":"road","-05-02":"road","-06-03":"road","-06-04":"road","-05-05":"road","-04-06":"road","-03-06":"road","+02-05":"road","+03-06":"road","+04-06":"road","+05-05":"road","+06-04":"road","+06-03":"road","+05-02":"road","+04-03":"road","+03-04":"road","+02-04":"extension","+02-03":"extension","+03-03":"extension","+03-02":"extension","+04-02":"extension","-01-01":"road","+01-01":"road","+01+01":"road","-01+01":"road"},"8":{"-01+02":"nuker","+01+02":"observer","+00-02":"powerSpawn","+02-01":"tower","+02+01":"tower","-02-01":"tower","+02+00":"spawn","+00+04":"extension","+00-04":"extension","+01-05":"extension","+01-06":"extension","+02-06":"extension","-01-06":"extension","-02-06":"extension","-01-05":"extension","-06-02":"extension","+06-02":"extension","-05-03":"lab","-05-04":"lab","-04-04":"lab","-04-05":"lab","-03-05":"lab","-02-04":"lab","-02-03":"lab","-03-03":"lab","-03-02":"lab","-04-02":"lab","+07+02":"road","+07+01":"road","+07-01":"road","+07-02":"road","+02-07":"road","+01-07":"road","-02-07":"road","-01-07":"road","-07-02":"road","-07-01":"road","-07+01":"road","-07+02":"road","-02+07":"road","-01+07":"road","+01+07":"road","+02+07":"road"}}'

global.RES_COLORS = {
	H: '#989898',
	O: '#989898',
	U: '#48C5E5',
	L: '#24D490',
	K: '#9269EC',
	Z: '#D9B478',
	X: '#F26D6F',
	energy: '#FEE476',
	power: '#F1243A',
	
	OH: '#B4B4B4',
	ZK: '#B4B4B4',
	UL: '#B4B4B4',
	G: '#FFFFFF',
	
	UH: '#50D7F9',
	UO: '#50D7F9',
	KH: '#A071FF',
	KO: '#A071FF',
	LH: '#00F4A2',
	LO: '#00F4A2',
	ZH: '#FDD388',
	ZO: '#FDD388',
	GH: '#FFFFFF',
	GO: '#FFFFFF',
	
	UH2O: '#50D7F9',
	UHO2: '#50D7F9',
	KH2O: '#A071FF',
	KHO2: '#A071FF',
	LH2O: '#00F4A2',
	LHO2: '#00F4A2',
	ZH2O: '#FDD388',
	ZHO2: '#FDD388',
	GH2O: '#FFFFFF',
	GHO2: '#FFFFFF',
	
	XUH2O: '#50D7F9',
	XUHO2: '#50D7F9',
	XKH2O: '#A071FF',
	XKHO2: '#A071FF',
	XLH2O: '#00F4A2',
	XLHO2: '#00F4A2',
	XZH2O: '#FDD388',
	XZHO2: '#FDD388',
	XGH2O: '#FFFFFF',
	XGHO2: '#FFFFFF'
}
