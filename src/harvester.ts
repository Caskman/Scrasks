import * as _ from 'lodash'
import * as ut from './utils'
import * as consts from './constants'

const HARVESTER_BODY = [MOVE,WORK,CARRY]

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

        // check if there's a container close by
        const source: Source = Game.getObjectById(c.memory.sourceID)
        const container = ut.getSourceContainer(source)
        if (!container) {
            // nope no container

            // is spawn full?
            if (ut.isSpawnFull(c.room)) {
                // yes, let's do container construction

                // are we building one currently
                const containerConstructionSites = ut.getSourceContainerConstructionSites(source)
                if (containerConstructionSites.length > 0) {
                    // yep we're building one, work on it
                    const location = containerConstructionSites[0]
                    ut.moveAndBuild(c, location)
                } else {
                    // nope, choose a building site if conditions are met
                    if (allSourcesHaveHarvesters(c.room) && spawnIsFull(c.room)) {
                        // conditions met, create construction site
                        const location = pickContainerLocation(source)
                        c.room.createConstructionSite(location, STRUCTURE_CONTAINER)
                    } else {
                        // conditions not met, store at spawn
                        storeEnergyAtBase(c)
                    }
                }
            } else {
                // no, let's go fill up spawn
                storeEnergyAtBase(c)
            }
        } else {
            // yes, let's store in it

            // is the container full?
            if (container.storeCapacity == container.store.energy) {
                // yes, store somewhere in base
                storeEnergyAtBase(c)
            } else {
                // no, store in the container
                ut.moveAndTransfer(c, container)
            }
        }
    }
}

export function spawnHarvesters(room: Room): number {
    const spawn = ut.getRoomMainSpawn(room)
    if (ut.canSpawnBody(spawn, HARVESTER_BODY)) {

        const harvesters = _.filter(ut.getRoomCreeps(room), c => c.memory.role == consts.HARVESTER_ROLE)
        const sourceJobs = (room.find(FIND_SOURCES) as Source[])
            .map(s => {
                return {
                    sourceID: s.id,
                    creeps: harvesters.filter(h => h.memory.sourceID == s.id)
                }
            })
        const underStaffedSources = _.filter(sourceJobs, 
            sj => sj.creeps.length < consts.HARVESTERS_PER_SOURCE)
        if (underStaffedSources.length > 0) {
            const sourceID = _.map(underStaffedSources, sj => sj.sourceID)[0]
            return spawn.spawnCreep(HARVESTER_BODY, ut.newName(consts.HARVESTER_ROLE), {
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
    const sources = room.find(FIND_SOURCES) as Source[]
    const sourceIDs = sources.map(s => s.id)
    const harvesters = ut.getRoomRoleCreeps(room, consts.HARVESTER_ROLE)
    const remainingSourceIDs = _.difference(sourceIDs, harvesters.map(h => h.memory.sourceID))
    return remainingSourceIDs.length == 0
}

function spawnIsFull(room: Room) {
    const spawn = ut.getRoomMainSpawn(room)
    return spawn.energy == spawn.energyCapacity
}

function pickContainerLocation(source: Source) {
    const room = source.room
    const spawn = ut.getRoomMainSpawn(room)
    const sPos = source.pos

    const allSites = ut.getAreaSites(sPos, 2).filter(s => !s.structure && s.terrain != 'wall')
    const harvestingSites = allSites.filter(s => sPos.getRangeTo(s.x, s.y) == 1)
    const possibleSites = allSites.filter(s => sPos.getRangeTo(s.x, s.y) == 2)
    const bestAdjacencies = ut.getHighestScoring(possibleSites, s => {
        const adjacentHarvestingSites = harvestingSites.filter(
            as => room.getPositionAt(as.x, as.y).getRangeTo(s.x, s.y) == 1)
        return adjacentHarvestingSites.length
    })
    const closestSites = ut.getLowestScoring(bestAdjacencies, s => spawn.pos.getRangeTo(s.x, s.y))
    const site = closestSites[0]
    return room.getPositionAt(site.x, site.y)
}

