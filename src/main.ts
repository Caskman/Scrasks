import * as _ from 'lodash'
import { manageCreeps } from './creeps'
import { checkExtensions } from './extensions'
import { checkControllerContainers, checkSourceContainers, checkRoads, removeDuplicateContainers } from './infrastructure'

/**
 * get depot building running along with all energy gathering and storing using the depot
 * re-enable extension building and verify that works well
 * 
 * to get to Storage we need to speed up upgrading
 *      for that we need to have another container act as a temp Storage depot until we can get to Storage tech
 *      then we'll work on the transition from there
 */

 export const loop = function() {

    cleanCreeps()

    const room = _.values(Game.rooms)[0] as Room

    // if (Game.time % 53) {
    //     checkExtensions(room)
    // }

    if (Game.time % 37 == 0) {
        removeDuplicateContainers(room)
    }

    if (Game.time % 31 == 0) {
        checkSourceContainers(room)
    }

    if (Game.time % 29 == 0) {
        checkControllerContainers(room)
    }

    if (Game.time % 23 == 0) {
        checkRoads(room)
    }

    manageCreeps(room)

}

function cleanCreeps() {
    const memoryCreeps = _.keys(Memory.creeps)
    const existingCreeps = _.keys(Game.creeps)
    const dirtyCreeps = _.difference(memoryCreeps, existingCreeps)
    dirtyCreeps.forEach(c => delete Memory.creeps[c])
}

