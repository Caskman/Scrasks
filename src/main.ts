import * as _ from 'lodash'
import { manageCreeps } from './creeps'

export const loop = function() {

    cleanCreeps()

    const room = _.values(Game.rooms)[0]

    manageCreeps(room)

}

function cleanCreeps() {
    const memoryCreeps = _.keys(Memory.creeps)
    const existingCreeps = _.keys(Game.creeps)
    const dirtyCreeps = _.difference(memoryCreeps, existingCreeps)
    dirtyCreeps.forEach(c => delete Memory.creeps[c])
}

/**
 * TODOS
 * 
 * get upgraders to pull from containers before source
 * 
 * get upgraders to build containers
 * add controller haul job
 * 
 * make controller hauler's source variable
 * 
 * get haulers to build roads
 * get container placement to be closer to spawn and create code to help with breaking ties
 * 
 * 
 * 
 */