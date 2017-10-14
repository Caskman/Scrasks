import * as _ from 'lodash'
import * as ut from './utils'
import * as consts from './constants'

const UPGRADER_BODY = [MOVE,WORK,CARRY]
const UPGRADERS_PER_CONTROLLER = 2

export function runUpgrader(c: Creep) {
    if (c.memory.upgrading && ut.atEmptyEnergy(c)) {
        c.memory.upgrading = false
    } else if (!c.memory.upgrading && ut.atFullEnergy(c)) {
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
    const spawn = ut.getRoomMainSpawn(room)
    const upgraders = _.filter(ut.getRoomCreeps(room), c => c.memory.role == consts.UPGRADER_ROLE)
    if (upgraders.length < UPGRADERS_PER_CONTROLLER && ut.canSpawnBody(spawn, UPGRADER_BODY)) {
        spawn.spawnCreep(UPGRADER_BODY, ut.newName(consts.UPGRADER_ROLE), {memory: {
            role: consts.UPGRADER_ROLE,
        }})
    }
}

