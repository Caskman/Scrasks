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
            // no

            // is there a container construction site?
            const sites = ut.getControllerContainerConstructionSites(c.room)
            if (sites.length > 0) {
                // yes, let's continue building it
                ut.moveAndBuild(c, sites[0])
            } else {
                // no, should we build a container?
                // do the sources have containers?
                if (_.every(ut.getValidSources(c.room), s => !!ut.getSourceContainer(s))) {
                    // yes, let's build a controller container
                    const site = pickContainerConstructionSite(c.room)
                    site.createConstructionSite(STRUCTURE_CONTAINER)
                } else {
                    // no, let's go upgrade instead
                    moveAndUpgrade(c)
                }
            }
        } else {
            // yes, let's go upgrade
            moveAndUpgrade(c)
        }
    } else {
        // let's get some energy
        ut.getEnergyFromAnywhere(c)
    }
}

function moveAndUpgrade(c: Creep) {
    const controller = c.room.controller
    if (c.upgradeController(controller) == ERR_NOT_IN_RANGE) {
        c.moveTo(controller)
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
