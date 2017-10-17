import * as _ from 'lodash'
import * as ut from './utils'
import * as consts from './constants'

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
            const target = Game.getObjectById(c.memory.targetID)
            let code = null as number
            if (c.memory.mode == REPAIR_MODE) {
                code = ut.moveAndRepair(c, target as Structure)
            } else if (c.memory.mode == BUILD_MODE) {
                code = ut.moveAndBuild(c, target as ConstructionSite)
            } else {
                throw new Error("No mode for builder!")
            }
            if (code == ERR_INVALID_TARGET) {
                // building is finished, cancel target
                c.memory.targetID = null
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
                const repairTargets = c.room.find(FIND_STRUCTURES, 
                    {filter: (s: Structure) => 
                        s.structureType != STRUCTURE_ROAD
                            && (s.hits / s.hitsMax) < 0.9}) as Structure[]
                const lowestHealth = _.min(repairTargets, t => t.hits / t.hitsMax)
                if (lowestHealth) {
                    c.memory.targetID = lowestHealth.id
                    c.memory.mode = REPAIR_MODE
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
    if (ut.hasBasicInfra(room)) {
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
