global.ENERGY_STATES = {
	4:		400e3,
	3:		200e3,
	2:		100e3,
	1:		50e3,
	0:		0
}

/* TODO
 * Make the processes in STATE_PROCESSES
 * Yikes
*/

global.STATE_PROCESSES = {
	4:		['ProcessPower', ''],
	3:		['Fortify', 'Siege'],
	2:		['MinePower', 'MineMineral', 'Reactions', 'RemoteMineSK'],
	1:		['RemoteMine', 'Market'],
	0:		['Mine', 'UpgradeController']
}

Room.prototype.getState = function() {
    let maxState =  _.max(_.keys(ENERGY_STATES))
    let energy =    _.sum( (this.storage && this.storage.store['energy']) && (this.terminal && this.terminal.store['energy']) )

    for (let i = 0; i <= maxState; i++) {
        if (energy >= ENERGY_STATES[i]) {
            continue
        }

        return i
    }
}