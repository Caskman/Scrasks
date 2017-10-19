import * as _ from 'lodash'
import * as ut from './utils'
import * as consts from './constants'
import * as infra from './infrastructure'

const BARE_BONES_BUILDER_BODY = [MOVE,WORK,CARRY]

const REPAIR_MODE = "REPAIR_MODE"
const BUILD_MODE = "BUILD_MODE"

export function runBuilder(c: Creep) {
    if (c.memory.building && ut.atEmptyEnergy(c)) {
        c.memory.building = false
    } else if (!c.memory.building && ut.atFullEnergy(c)) {
        c.memory.building = true
    }

    if (c.memory.building) {
        // building, do we have a target?

        if (c.memory.targetID) {
            // yes

            // which mode?
            const target = Game.getObjectById(c.memory.targetID)
            let code = null as number
            if (c.memory.mode == REPAIR_MODE) {
                // repair, is the target repaired?
                const repairTarget = target as Structure
                if (repairTarget.hits == repairTarget.hitsMax) {
                    // yes, cancel target
                    c.memory.targetID = null
                } else {
                    // no, repair it
                    code = ut.moveAndRepair(c, target as Structure)
                }
            } else if (c.memory.mode == BUILD_MODE) {
                // building, build it!
                code = ut.moveAndBuild(c, target as ConstructionSite)
                if (code == ERR_INVALID_TARGET) {
                    // building is finished, cancel target
                    c.memory.targetID = null
                }
            } else {
                throw new Error("No mode for builder!")
            }
        } else {
            // no, don't have a target
            // pick a construction site
            const site = ut.getRoomMainSpawn(c.room).pos
                .findClosestByRange(FIND_CONSTRUCTION_SITES) as ConstructionSite
            if (site) {
                c.memory.targetID = site.id
                c.memory.mode = BUILD_MODE
            } else {
                // no construction site available
                // pick a repair target
                const repairTarget = findRepairTarget(c)
                if (repairTarget) {
                    c.memory.targetID = repairTarget.id
                    c.memory.mode = REPAIR_MODE
                } else {
                }
            }
        }
    } else {
        // recharging
        ut.getEnergyFromAnywhere(c)
    }
}

export function spawnBuilders(room: Room): number {
    let targetBody = null as string[]
    // is basic infra in place?
    if (ut.sourcesHaveContainers(room)) {
        // yes, best builder possible
        targetBody = ut.fillBody(room, [MOVE], [WORK,CARRY,CARRY])
    } else {
        // no, basic builder
        targetBody = BARE_BONES_BUILDER_BODY
    }
    const spawn = ut.getRoomMainSpawn(room)
    if (ut.canSpawnBody(spawn, targetBody)) {
        const builders = ut.getRoomRoleCreeps(room, consts.BUILDER_ROLE)
        if (builders.length < consts.BUILDERS_PER_ROOM) {
            return spawn.spawnCreep(targetBody, ut.newName(consts.BUILDER_ROLE), {
                memory: {
                    role: consts.BUILDER_ROLE,
                }
            })
        }
    }
}

function findRepairTarget(c: Creep) {
    let repairTargets = c.room.find(FIND_STRUCTURES, 
        {filter: (s: Structure) => 
            s.structureType != STRUCTURE_ROAD
                && (s.hits / s.hitsMax) < 0.9}) as Structure[]
    const desiredPaths = infra.getDesiredRoads(c.room)
    const roadStructures = _.flattenDeep(desiredPaths.map(path => {
        const messedUpStructsList = path.map(spot => {
            const structures = c.room.lookForAt(
                LOOK_STRUCTURES, spot.x, spot.y) as Structure[]
            const roads = structures
                .filter(s => s.structureType == STRUCTURE_ROAD)
            return roads
        })
        const structs = _.flatten(messedUpStructsList)
        return structs
    })) as Structure[]
    repairTargets = repairTargets.concat(roadStructures)
    const lowestHealth = _.min(repairTargets, t => t.hits / t.hitsMax)
    return lowestHealth
}
