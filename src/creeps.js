//@flow
import { Game, Memory } from './cask-screeps'

export function spawnCreeps() {
    Game.spawns["Spawn1"].createCreep(['WORK','MOVE','CARRY'])
    return true
}

