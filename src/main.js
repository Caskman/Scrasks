//@flow
import _ from 'lodash'
import { cleanMemory } from './utils'
import { manageRoom } from './rooms'
import { manageCreeps } from './creeps'

export const loop = function() {

    cleanMemory()

    categorize()
    // spawnCreeps()

    _.each(Game.rooms, room => manageRoom(room))
    manageCreeps()

    // console.log(Game.spawns['Spawn1'].energy)



}

function categorize() {

}
