'use strict'

/*
 * Get type of room from name
 *
 * @author engineeryo
 * @co-author warinternal
 */
Room.describe = function(name) {
	const [EW, NS] = name.match(/\d+/g)
  	if (EW%10 == 0 || NS%10 == 0) {
		return 'HIGHWAY'
	}
	else if (EW%5 == 0 && NS%5 == 0) {
		return 'CENTER'
	}
	else if (Math.abs(5 - EW%10) <= 1 && Math.abs(5 - NS%10) <= 1) {
		return 'SOURCE_KEEPER'
	}
	else {
		return 'ROOM'
	}
}
