//@flow
const Game = require('./cask-screeps').Game
const Memory = require('./cask-screeps').Memory
const _ = require('lodash')

exports.cleanMemory = function() {
    _.flow([
        creepObjs => _.filter(creepObjs, o => !Game.creeps[o.name]),
        deadCreeps => _.each(deadCreeps, c => delete Memory.creeps[c.name])
    ])(Memory.creeps)
}
