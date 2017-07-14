//@flow
import { spawnCreeps } from './creeps'
import { cleanMemory } from './utils'

export function loop() {

    cleanMemory()
    spawnCreeps()

}
