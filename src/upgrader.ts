import * as _ from 'lodash'
import * as cu from './creep-utils'
import * as consts from './constants'

const UPGRADER_BODY = [MOVE,WORK,CARRY]
const UPGRADERS_PER_CONTROLLER = 1

export function runUpgrader(c: Creep) {
    if (c.memory.upgrading && cu.atEmptyEnergy(c)) {
        c.memory.upgrading = false
    } else if (!c.memory.upgrading && cu.atFullEnergy(c)) {
        c.memory.upgrading = true
    }

    if (c.memory.upgrading) {
        const controller = c.room.controller
        if (c.upgradeController(controller) == ERR_NOT_IN_RANGE) {
            c.moveTo(controller)
        }
    } else {
        const source: Source = c.pos.findClosestByRange(FIND_SOURCES_ACTIVE)
        if (source) {
            if (c.harvest(source) == ERR_NOT_IN_RANGE) {
                c.moveTo(source)
            }
        } else {
            throw new Error("why no sources for controller?")
        }
    }
}

export function spawnUpgraders(room: Room) {
    const spawn = cu.getRoomMainSpawn(room)
    const upgraders = _.filter(cu.getRoomCreeps(room), c => c.memory.role == consts.UPGRADER_ROLE)
    if (upgraders.length < UPGRADERS_PER_CONTROLLER && cu.canSpawnBody(spawn, UPGRADER_BODY)) {
        spawn.spawnCreep(UPGRADER_BODY, cu.newName(consts.UPGRADER_ROLE), {memory: {
            role: consts.UPGRADER_ROLE,
        }})
    }
}

