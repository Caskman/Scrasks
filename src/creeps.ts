import * as _ from 'lodash'

import * as ut from './utils'
import * as consts from './constants'

import { spawnHarvesters, runHarvester } from './harvester'
import { spawnUpgraders, runUpgrader } from './upgrader'
import { spawnHaulers, runHauler } from './hauler'
import { spawnBuilders, runBuilder } from './builder'

export function manageCreeps(room: Room) {

    const spawns: Spawn[] = room.find(FIND_MY_SPAWNS)
    const spawn = spawns[0]

    const spawners = [
        spawnHarvesters,
        spawnHaulers,
        spawnBuilders,
        spawnUpgraders,
    ]
    _.each(spawners, s => {
        if (s(room) == OK) {
            return false
        }
    })

    runCreeps(room)
}

function runCreeps(room: Room) {
    _.each(ut.getRoomCreeps(room), c => {
        if (c.memory.role == consts.HARVESTER_ROLE) {
            runHarvester(c)
        } else if (c.memory.role == consts.UPGRADER_ROLE) {
            runUpgrader(c)
        } else if (c.memory.role == consts.HAULER_ROLE) {
            runHauler(c)
        } else if (c.memory.role == consts.BUILDER_ROLE) {
            runBuilder(c)
        }
    })
}

