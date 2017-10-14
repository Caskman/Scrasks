import { manageCreeps } from './creeps'

export const loop = function() {


    const spawn = Game.spawns["Spawn1"]


    manageCreeps(spawn)

}

