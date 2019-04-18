'use strict'

Object.defineProperty(Source.prototype, "memory", {
  configurable: true,
  get: function() {
      if (_.isUndefined(Memory.sources)) {
          Memory.sources = {}
      }
      if (!_.isObject(Memory.sources)) {
          return undefined
      }
      return Memory.sources[this.id] = Memory.sources[this.id] || {}
  },
  
  set: function(value) {
      if (_.isUndefined(Memory.sources)) {
          Memory.sources = {}
      }
      if (!_.isObject(Memory.sources)) {a
          throw new Error(`Memory already set for ${this.id}`)
      }
      Memory.sources[this.id] = value
  }
})

Object.defineProperty(RoomObject.prototype, "memory", {
  configurable: true,
  get: function() {
      if (_.isUndefined(Memory.roomObjects)) {
          Memory.roomObjects = {}
      }
      if (!_.isObject(Memory.roomObjects)) {
          return undefined
      }
      return Memory.roomObjects[this.id] = Memory.roomObjects[this.id] || {}
  },
  
  set: function(value) {
      if (!_.isObject(Memory.roomObjects)) {
          throw new Error(`Memory already set for ${this.id}`)
      }
      Memory.roomObjects[this.id] = value
  }
})
