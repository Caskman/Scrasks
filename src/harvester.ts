import * as _ from 'lodash'
import * as ut from './utils'
import * as consts from './constants'

const BASIC_HARVESTER_BODY = [MOVE,WORK,CARRY]

export function runHarvester(c: Creep) {
    if (c.memory.harvesting && ut.atFullEnergy(c)) {
        c.memory.harvesting = false
    } else if (!c.memory.harvesting && ut.atEmptyEnergy(c)) {
        c.memory.harvesting = true
    }

    if (c.memory.harvesting) {
        const source: Source = Game.getObjectById(c.memory.sourceID)
        ut.moveAndHarvest(c, source)
    } else {
        // find a place to store energy

        const source = Game.getObjectById(c.memory.sourceID) as Source
        // is the spawn full?
        if (ut.isSpawnFull(c.room)) {
            // yes, go to secondary
            secondaryPriority(c)
        } else {
            // no, do we have a container and hauler?
            const container = ut.getSourceContainer(source)
            if (container && ut.containerHasHauler(container)) {
                // yes, go to secondary
                secondaryPriority(c)
            } else {
                // no, store the energy yourself
                storeEnergyAtBase(c)
            }
        }
    }
}

function secondaryPriority(c: Creep) {
    // do we have a container?
    const source = Game.getObjectById(c.memory.sourceID) as Source
    const container = ut.getSourceContainer(source)
    if (container) {
        // yes, store in it
        ut.moveAndTransfer(c, container)
    } else {
        // no, do we have a container construction site?
        const containerConstructionSites = ut.getSourceContainerConstructionSites(source)
        if (containerConstructionSites.length > 0) {
            // yep we're building one, work on it
            const location = containerConstructionSites[0]
            ut.moveAndBuild(c, location)
        } else {
            // nope, just store energy at base
            storeEnergyAtBase(c)
        }
    }
}

export function spawnHarvesters(room: Room): number {
    // is basic infrastructure in place?
    let targetBody = null as string[]
    if (ut.hasBasicInfra(room)) {
        // yes, let's build the biggest harvester possible
        targetBody = ut.fillBody(room, [MOVE, CARRY], [WORK])
    } else {
        // no, build basic body
        targetBody = BASIC_HARVESTER_BODY
    }

    const spawn = ut.getRoomMainSpawn(room)
    if (ut.canSpawnBody(spawn, targetBody)) {
        const underStaffedSources = ut.getUnderStaffedSources(room)
        if (underStaffedSources.length > 0) {
            const sourceID = _.map(underStaffedSources, sj => sj.sourceID)[0]
            return spawn.spawnCreep(targetBody, ut.newName(consts.HARVESTER_ROLE), {
                memory: {
                    role: consts.HARVESTER_ROLE,
                    sourceID,
                }
            })
        }
    }

}

function storeEnergyAtBase(c: Creep) {
    const depot = ut.findDepot(c.room)
    if (depot) {
        ut.moveAndTransfer(c, depot)
    } else {
        storeAtSpawn(c)
    }
}

function storeAtSpawn(c: Creep) {
    const spawn = ut.getRoomMainSpawn(c.room)
    ut.moveAndTransfer(c, spawn)
}

function allSourcesHaveHarvesters(room: Room) {
    return ut.getUnderStaffedSources(room).length == 0
}

