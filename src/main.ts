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