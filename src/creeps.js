//@flow
import { Game, Memory } from './cask-screeps'

export const spawnCreeps = function() {
    return Game.spawns["Spawn1"].createCreep(['WORK','MOVE','CARRY'])
}

