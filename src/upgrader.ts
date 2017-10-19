import * as _ from 'lodash'
import * as ut from './utils'
import * as consts from './constants'

const BARE_BONES_UPGRADER_BODY = [MOVE,WORK,CARRY]

export function runUpgrader(c: Creep) {
    if (c.memory.upgrading && ut.atEmptyEnergy(c)) {
        c.memory.upgrading = false
    } else if (!c.memory.upgrading && ut.atFullEnergy(c)) {
        c.memory.upgrading = true
    }

    if (c.memory.upgrading) {
        // does controller have container?
        if (!ut.getControllerContainer(c.room)) {
            // no

            // is there a container construction site?
            const sites = ut.getControllerContainerConstructionSites(c.room)
            if (sites.length > 0) {
                // yes, let's continue building it
                ut.moveAndBuild(c, sites[0])
            } else {
                // no, should we build a container?
                moveAndUpgrade(c)
            }
        } else {
            // yes, let's go upgrade
            moveAndUpgrade(c)
        }
    } else {
        // let's get some energy
        ut.getEnergyQuickly(c)
    }
}

export function spawnUpgraders(room: Room): number {
    let targetBody = null as string[]
    if (ut.sourcesHaveContainers(room) && !!ut.getControllerContainer(room) && ut.anyRoadConstructionSites(room)) {
        targetBody = ut.fillBody(room, [MOVE,CARRY], [WORK])
    } else {
        targetBody = BARE_BONES_UPGRADER_BODY
    }

    const spawn = ut.getRoomMainSpawn(room)
    const upgraders = ut.getRoomRoleCreeps(room, consts.UPGRADER_ROLE)
    const staffingLevel = desiredUpgaderStaffingLevel(room)
    if (upgraders.length < staffingLevel && ut.canSpawnBody(spawn, targetBody)) {
        return spawn.spawnCreep(targetBody, ut.newName(consts.UPGRADER_ROLE), {memory: {
            role: consts.UPGRADER_ROLE,
        }})
    }
}

function moveAndUpgrade(c: Creep) {
    const controller = c.room.controller
    if (c.upgradeController(controller) == ERR_NOT_IN_RANGE) {
        c.moveTo(controller)
    }
}

function desiredUpgaderStaffingLevel(room: Room) {
    if (ut.sourcesHaveContainers(room) && !!ut.getControllerContainer(room)) {
        return consts.BASIC_INFRA_UPGRADERS_PER_CONTROLLER
    } else {
        return consts.BARE_BONES_UPGRADERS_PER_CONTROLLER
    }
}
