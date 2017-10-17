import * as _ from 'lodash'
import * as ut from './utils'
import * as consts from './constants'

const UPGRADER_BODY = [MOVE,WORK,CARRY]

export function runUpgrader(c: Creep) {
    if (c.memory.upgrading && ut.atEmptyEnergy(c)) {
        c.memory.upgrading = false
    } else if (!c.memory.upgrading && ut.atFullEnergy(c)) {
        c.memory.upgrading = true
    }

    if (c.memory.upgrading) {
        // does controller have container?
        if (!ut.getControllerContainer(c.room)) {
            // build container

            // is there a construction site?
            const sites = ut.getControllerContainerConstructionSites(c.room)
            if (sites.length > 0) {
                // yes, let's continue building it
                ut.moveAndBuild(c, sites[0])
            } else {
                // no let's create one
                const site = pickContainerConstructionSite(c.room)
                site.createConstructionSite(STRUCTURE_CONTAINER)
            }
        } else {
            // go upgrade
            const controller = c.room.controller
            if (c.upgradeController(controller) == ERR_NOT_IN_RANGE) {
                c.moveTo(controller)
            }
        }
    } else {
        // let's get some energy
        ut.getEnergyFromAnywhere(c)
    }
}

export function spawnUpgraders(room: Room): number {
    const spawn = ut.getRoomMainSpawn(room)
    const upgraders = _.filter(ut.getRoomCreeps(room), c => c.memory.role == consts.UPGRADER_ROLE)
    if (upgraders.length < consts.UPGRADERS_PER_CONTROLLER && ut.canSpawnBody(spawn, UPGRADER_BODY)) {
        return spawn.spawnCreep(UPGRADER_BODY, ut.newName(consts.UPGRADER_ROLE), {memory: {
            role: consts.UPGRADER_ROLE,
        }})
    }
}

function pickContainerConstructionSite(room: Room) {
    const pos = room.controller.pos
    const spawn = ut.getRoomMainSpawn(room)

    let sites = ut.getAreaSites(pos, 2)
    sites = sites.filter(s => !s.structure && s.terrain != "wall")
    sites = ut.getLowestScoring(sites, s => ut.manhattanDist(s.x, s.y, spawn.pos.x, spawn.pos.y))
    return room.getPositionAt(sites[0].x, sites[0].y)
}
