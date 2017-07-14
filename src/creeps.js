//@flow
const Game = require('./cask-screeps').Game
const Memory = require('./cask-screeps').Memory

exports.spawnCreeps = function() {
    return Game.spawns["Spawn1"].createCreep(['WORK','MOVE','CARRY'])
    // return true
}

