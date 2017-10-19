import * as _ from 'lodash'
import * as ut from './utils'
import { TileMap } from './TileMap'

export function checkControllerContainers(room: Room) {
    const containerizedSources = ut.sourcesHaveContainers(room)
    const noControllerContainer = !ut.getControllerContainer(room)
    const noControllerContainerConstructionSites = ut.getControllerContainerConstructionSites(room).length == 0
    
    if (
        containerizedSources
            && noControllerContainer
            && noControllerContainerConstructionSites
    ) {
        const location = pickControllerContainerLocation(room)
        room.createConstructionSite(location, STRUCTURE_CONTAINER)
    }
}

export function checkSourceContainers(room: Room) {
    // get source that are fully staffed
    const staffedSources = ut.getFullyStaffedSources(room)
    // get sources that don't have containers
    const uncontaineredSources = staffedSources.filter(
        s => !ut.getSourceContainer(Game.getObjectById(s.sourceID)))
    // and make sure those sources don't have container construction sites
    const unconstructionSitedSources = uncontaineredSources.filter(s => {
        const source = Game.getObjectById(s.sourceID) as Source
        const constructionSites = source.pos.findInRange(FIND_CONSTRUCTION_SITES, 2,
            {filter: (s: Structure) => s.structureType == STRUCTURE_CONTAINER}) as ConstructionSite[]
        return constructionSites.length == 0
    })
    // build construction sites on any of those that remain
    if (unconstructionSitedSources.length > 0) {
        unconstructionSitedSources.forEach(s => {
            const location = pickSourceContainerLocation(Game.getObjectById(s.sourceID))
            room.createConstructionSite(location, STRUCTURE_CONTAINER)
        })
    }
}

function pickControllerContainerLocation(room: Room) {
    const pos = room.controller.pos
    const spawn = ut.getRoomMainSpawn(room)

    let sites = ut.getAreaSites(pos, 2)
    sites = sites.filter(s => !s.structure && s.terrain != "wall")
    sites = ut.getLowestScoring(sites, s => ut.manhattanDist(s.x, s.y, spawn.pos.x, spawn.pos.y))
    return room.getPositionAt(sites[0].x, sites[0].y)
}

function pickSourceContainerLocation(source: Source) {
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
    const evenClosestSites = ut.getLowestScoring(closestSites, 
        s => ut.manhattanDist(spawn.pos.x, spawn.pos.y, s.x, s.y))
    const site = evenClosestSites[0]
    return room.getPositionAt(site.x, site.y)
}

export function checkRoads(room: Room) {
    // are there currently roads being built?
    const roadConstructionSites = room.find(FIND_CONSTRUCTION_SITES, 
        {filter: (s: Structure) => s.structureType == STRUCTURE_ROAD})
    if (roadConstructionSites.length == 0) {
        // no, let's setup some road construction sites
        const spawn = ut.getRoomMainSpawn(room)
        const desiredRoads = getDesiredRoads(room)
        desiredRoads.forEach(path => {
            path.forEach(ps => {
                const pos = room.getPositionAt(ps.x, ps.y)
                pos.createConstructionSite(STRUCTURE_ROAD)
            })
        })
    }
}

export function getDesiredRoads(room: Room) {
    const containers = room.find(FIND_STRUCTURES, {filter: 
        (s: Structure) => s.structureType == STRUCTURE_CONTAINER}) as StructureContainer[]
    const desiredPaths = containers.map(c => {
        return getPathFromSpawnToContainer(room, c)
    })
    return desiredPaths
}

export function getPathFromSpawnToContainer(room: Room, c: StructureContainer) {
    const spawn = ut.getRoomMainSpawn(room)
    // find the desired ending point from spawn to container
    const containerAdjacentSites = ut.createAreaListFrom(c.pos, 1)
    // get the spots closest to spawn
    const closestSites = ut.getLowestScoring(containerAdjacentSites, 
        s => ut.manhattanDist(spawn.pos.x, spawn.pos.y, s.x, s.y))
    const chosenDestination = closestSites[0]
    const destinationPos = room.getPositionAt(chosenDestination.x, chosenDestination.y)
    const path = spawn.pos.findPathTo(destinationPos, {
        ignoreCreeps: true,
    })
    return path
}

export function removeDuplicateContainers(room: Room) {
    const containers = room.find(FIND_STRUCTURES, {filter: (s: Structure) => s.structureType == STRUCTURE_CONTAINER}) as StructureContainer[]
    const containerGroups = _.groupBy(containers, c => `${c.pos.x},${c.pos.y}`)
    const duplicateGroups = _.filter(containerGroups, cs => cs.length > 1)
    duplicateGroups.forEach(cs => {
        const clone = [...cs]
        clone.shift()
        clone.forEach(c => c.destroy())
    })
}

export function checkDepot(room: Room) {
    // is there already a depot?
    if (!ut.findDepot(room)) {
        // no, should we build a depot?
        if (ut.sourcesHaveContainers(room)) {
            // yes, build the depot
            const location = pickDepotLocation(room)
            // pick adjacent location for preliminary depot
            const spawn = ut.getRoomMainSpawn(room)
            const sites = ut.createAreaListFrom(location, 1)
            const closestSites = sites
                // spots within 2 range of spawn
                .filter(s => spawn.pos.getRangeTo(s.x, s.y) == 2)
            const containerLocation = closestSites[0]
            room.createConstructionSite(
                containerLocation.x, containerLocation.y, 
                STRUCTURE_CONTAINER)
        }
    }
}

function pickDepotLocation(room: Room): RoomPosition {
    const spawn = ut.getRoomMainSpawn(room)
    const sites = ut.createAreaListFrom(spawn.pos, 2)
    const ringSites = sites.filter(s => 
        ut.manhattanDist(spawn.pos.x, spawn.pos.y, s.x, s.y))
    const controlPos = room.controller.pos
    const closestToController = ut.getLowestScoring(ringSites, 
        s => ut.manhattanDist(s.x, s.y, controlPos.x, controlPos.y))
    const location = closestToController[0]
    return room.getPositionAt(location.x, location.y)
}
