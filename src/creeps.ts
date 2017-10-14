import * as _ from 'lodash'

import * as cu from './creep-utils'
import * as consts from './constants'

import { spawnHarvesters, runHarvester } from './harvester'
import { spawnUpgraders, runUpgrader } from './upgrader'

export function manageCreeps(room: Room) {

    const spawns: Spawn[] = room.find(FIND_MY_SPAWNS)
    const spawn = spawns[0]

    spawnHarvesters(room)
    spawnUpgraders(room)

    runCreeps(room)
}

function runCreeps(room: Room) {
    _.each(cu.getRoomCreeps(room), c => {
        if (c.memory.role == consts.HARVESTER_ROLE) {
            runHarvester(c)
        } else if (c.memory.role == consts.UPGRADER_ROLE) {
            runUpgrader(c)
        }
    })
}

