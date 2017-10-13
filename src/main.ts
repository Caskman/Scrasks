//@flow
import * as _ from 'lodash'

export const loop = function() {

    const spawn = Game.spawns["Spawn1"]
    const WORKER_BODY = [MOVE,WORK,CARRY]
    const source: Structure = Game.getObjectById("eff307740862fd8")

    const worker_mem = {
        role: "HARVESTER"
    }

    if (spawn.canCreateCreep(WORKER_BODY) == OK) {
        spawn.createCreep(WORKER_BODY, null, worker_mem)
    }

    _.each(Game.creeps, c => {
        if (c.memory.role == "HARVESTER") {
            if (c.memory["hauling"] && c.carry.energy == 0) {
                c.memory["hauling"] = false
            } else if (!c.memory["hauling"] && c.carry.energy == c.carryCapacity) {
                c.memory["hauling"] = true
            }

            if (c.memory["hauling"]) {
                if (c.transfer(spawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    c.moveTo(spawn)
                }
            } else {
                const code = c.withdraw(source, RESOURCE_ENERGY)
                if (code == ERR_NOT_IN_RANGE) {
                    c.moveTo(source)
                }
            }
        }
    })

}

