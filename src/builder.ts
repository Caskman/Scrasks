import * as _ from 'lodash'
import * as ut from './utils'
import * as consts from './constants'

const BARE_BONES_BUILDER_BODY = [MOVE,WORK,CARRY]

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
            const target = Game.getObjectById(c.memory.targetID) as ConstructionSite
            if (ut.moveAndBuild(c, target) == ERR_INVALID_TARGET) {
                // building is finished, cancel target
                c.memory.targetID = null
            }
        } else {
            // no, don't have target, pick one
            const site = ut.getRoomMainSpawn(c.room).pos
                .findClosestByRange(FIND_CONSTRUCTION_SITES) as ConstructionSite
            if (site) {
                c.memory.targetID = site.id
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
