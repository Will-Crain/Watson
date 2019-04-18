'use strict'

Room.describe = function(roomName) {
  let [EW, NS] = roomName.match(/\d+/g)
  if (EW%10 == 0 || NS%10 == 0) {
      return 'HIGHWAY'
  }
  else if (EW%5 != 0 && NS%5 != 0) {
      return 'ROOM'
  }
  else if (EW%5 == 0 && NS%5 == 0) {
      return 'CENTER'
  }
  else {
      return 'SOURCE_KEEPER'
  }
}
