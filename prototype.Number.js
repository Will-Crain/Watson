'use strict'

Number.prototype.addLeadingZeros = function(size, sign = false) {
  let negative = this < 0
  let outStr = String(Math.abs(this))
  
  while (outStr.length < size) {
      outStr = '0' + outStr
  }
  
  if (sign == true) {
      if (negative) {
          outStr = '-' + outStr
      }
      else {
          outStr = '+' + outStr
      }
  }
  
  return outStr
}

Number.prototype.addSign = function() {
  if (this < 0) {
      return String(`${this}`)
  }
  else {
      return String(`+${this}`)
  }
}
