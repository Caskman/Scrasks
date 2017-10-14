import * as _ from 'lodash'
import * as cu from './creep-utils'
import * as consts from './constants'

const HARVESTER_BODY = [MOVE,WORK,CARRY]
const HARVESTERS_PER_SOURCE = 1

export function runHarvester(c: Creep) {
    if (c.memory.harvesting && cu.atFullEnergy(c)) {
        c.memory.harvesting = false
    } else if (!c.memory.harvesting && cu.atEmptyEnergy(c)) {
        c.memory.harvesting = true
    }

    if (c.memory.harvesting) {
        const source: Source = Game.getObjectById(c.memory.sourceID)
        const code = c.harvest(source)
        if (code == ERR_NOT_IN_RANGE) {
            c.moveTo(source)
        }
    } else {
        // find a place to store energy

        // check if there's a container close by
        const source: Source = Game.getObjectById(c.memory.sourceID)
        const containers = _.filter(source.pos.findInRange(FIND_STRUCTURES, 2) as Structure[], 
            s => s.structureType == STRUCTURE_CONTAINER)

        if (containers.length == 0) {
            // nope no container

            // are we building one currently
            const constructionLocations = source.pos.findInRange(FIND_CONSTRUCTION_SITES,2) as ConstructionSite[]
            const containerConstructionLocations = 
                constructionLocations.filter(cl => cl.structureType == STRUCTURE_CONTAINER)
            if (containerConstructionLocations.length > 0) {
                // yep we're building one, work on it
                const location = containerConstructionLocations[0]
                if (c.build(location) == ERR_NOT_IN_RANGE) {
                    c.moveTo(location)
                }
            } else {
                // nope, choose a building site if conditions are met
                if (allSourcesHaveHarvesters(c.room) && spawnIsFull(c.room)) {
                    // conditions met, create construction site
                    const location = pickContainerLocation(source)
                    c.room.createConstructionSite(location, STRUCTURE_CONTAINER)
                } else {
                    // conditions not met, store at spawn
                    moveAndTransfer(c, cu.getRoomMainSpawn(c.room))
                }
            }
        } else {
            const dest = containers[0]
            moveAndTransfer(c, dest)
        }

    }
}

function allSourcesHaveHarvesters(room: Room) {
    const sources = room.find(FIND_SOURCES) as Source[]
    const sourceIDs = sources.map(s => s.id)
    const harvesters = cu.getRoomRoleCreeps(room, consts.HARVESTER_ROLE)
    const remainingSourceIDs = _.difference(sourceIDs, harvesters.map(h => h.memory.sourceID))
    return remainingSourceIDs.length == 0
}

function spawnIsFull(room: Room) {
    const spawn = cu.getRoomMainSpawn(room)
    return spawn.energy == spawn.energyCapacity
}

function pickContainerLocation(source: Source) {
    const spawn = cu.getRoomMainSpawn(source.room)
    const room = spawn.room
    const sPos = source.pos

    const surrounding = room.lookForAtArea(LOOK_TERRAIN, 
        sPos.y - 2, sPos.x - 2, sPos.y + 2, sPos.x + 2, true) as LookAtResultWithPos[]
    const usableSpots = surrounding.filter(t => t.terrain != "wall")
    const sortedUsableSpots = _.sortBy(usableSpots, s => {
        return spawn.pos.findPathTo(s.x, s.y).length
    })
    const spot = sortedUsableSpots[0]
    const pos = room.getPositionAt(spot.x, spot.y)
    return pos
}

function moveAndTransfer(c: Creep, dest: Structure) {
    if (c.transfer(dest, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        c.moveTo(dest)
    }
}

export function spawnHarvesters(room: Room) {
    const spawn = cu.getRoomMainSpawn(room)
    if (cu.canSpawnBody(spawn, HARVESTER_BODY)) {
        type SourceObj = {
            sourceID: string,
            creeps: Creep[]
        }

        const harvesters = _.filter(cu.getRoomCreeps(room), c => c.memory.role == consts.HARVESTER_ROLE)
        const sources: Source[] = room.find(FIND_SOURCES)
        const sourceObjs: SourceObj[] = sources.map(s => {
            return {
                sourceID: s.id,
                creeps: []
            }
        })
        const sourceGroups = _.groupBy(harvesters, c => c.memory.sourceID)
        _.each(sourceGroups, (cs, sourceID) => {
            const obj = _.find(sourceObjs, {sourceID})
            if (obj) {
                obj.creeps = cs
            }
        })
        const underStaffedSources = _.filter(sourceObjs, so => so.creeps.length < HARVESTERS_PER_SOURCE)
        if (underStaffedSources.length > 0) {
            const sourceID = _.map(underStaffedSources, so => so.sourceID)[0]
            spawn.spawnCreep(HARVESTER_BODY, cu.newName(consts.HARVESTER_ROLE), {
                memory: {
                    role: consts.HARVESTER_ROLE,
                    sourceID,
                }
            })
        }
    }

}

