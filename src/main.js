//@flow
import { spawnCreeps } from './creeps'
import { cleanMemory } from './utils'

export const loop = function() {

    cleanMemory()
    spawnCreeps()

}
