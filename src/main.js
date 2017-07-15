//@flow
import { cleanMemory } from './utils'
import { Game, Memory } from './cask-screeps'
import { manageRoom } from './rooms'
import _ from 'lodash'

export const loop = function() {

    cleanMemory()
    // spawnCreeps()

    _.each(Game.rooms, room => manageRoom(room))
    // console.log(Game.spawns['Spawn1'].energy)



}
