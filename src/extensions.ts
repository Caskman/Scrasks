import * as _ from 'lodash'
import * as ut from './utils'
import { TileMap } from './TileMap'

type DIRECTION = number
type ABS_DIRECTION = DIRECTION
type REL_DIRECTION = DIRECTION

const NORTH: ABS_DIRECTION = 100
const SOUTH: ABS_DIRECTION = 200
const EAST: ABS_DIRECTION = 300
const WEST: ABS_DIRECTION = 400

const FORWARD: REL_DIRECTION = 500
const BACKWARD: REL_DIRECTION = 600
const LEFT: REL_DIRECTION = 700
const RIGHT: REL_DIRECTION = 800

type Site = {
    x: number,
    y: number,
}

type Vector = {
    x: number,
    y: number,
    dir: ABS_DIRECTION,
}

export function checkExtensions(room: Room) {
    // can we build more extensions?
    const extensions = room.find(FIND_STRUCTURES,
        {filter: (s: Structure) => s.structureType == STRUCTURE_EXTENSION}) as StructureExtension[]
    const numPossExts = CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][room.controller.level]
    if (extensions.length < numPossExts) {
        // yes we can
        console.log("can build more extensions")

        // are there extension construction sites?
        const extConstructSites = room.find(FIND_CONSTRUCTION_SITES, 
            {filter: (s: Structure) => s.structureType == STRUCTURE_EXTENSION}) as ConstructionSite[]
        if (extConstructSites.length == 0) {
            console.log("no extension construction sites detected")
            // no, let's build some
            const queue = [] as Vector[]
            // aggregate banned areas
            const spawnArea = ut.createAreaListFrom(ut.getRoomMainSpawn(room).pos, 1)
            const containers = room.find(FIND_STRUCTURES,
                {filter: (s: Structure) => s.structureType == STRUCTURE_CONTAINER}) as StructureContainer[]
            const containersAreas = containers.map(c => ut.createAreaListFrom(c.pos, 3))
            const sources = room.find(FIND_SOURCES) as Source[]
            const sourcesAreas = sources.map(s => ut.createAreaListFrom(s.pos, 2))
            const controllerArea = ut.createAreaListFrom(room.controller.pos, 2)
            const bannedAreas = _.flattenDeep(
                [spawnArea, containersAreas, controllerArea, sourcesAreas]) as Site[]
            const bannedSpotsMap = TileMap.fromSites(bannedAreas)

            const visitedSpotsMap = TileMap.bool()
            // add initial spots
            const spawn = ut.getRoomMainSpawn(room)
            const orients = [NORTH, SOUTH, WEST, EAST]
            orients.forEach(o => {
                const pos = getPosInDir(spawn.pos, o)
                queue.push({
                    dir: o,
                    x: pos.x,
                    y: pos.y,
                })
            })
            // iterate
            let terminateEntirely = false
            for (let queuePointer = 0; queuePointer < queue.length; queuePointer++) {
                console.log("===Running loop number " + queuePointer)
                const startingSpot = queue[queuePointer]
                console.log("Spot ("+startingSpot.x+","+startingSpot.y+") dir "+startingSpot.dir)
                // have we already visited this spot?
                if (visitedSpotsMap.get(startingSpot.x, startingSpot.y)) {
                    console.log("already visited; skipping")
                    continue
                }
                let terminateLine = false
                // build extensions for three paces on either side of this path
                // except for the middle one to allow traffic to pass through
                ut.forN(3, spotIndex => {
                    const currentSpot = getPosInRelDir(startingSpot, FORWARD, spotIndex + 1)
                    const currVec = {
                        x: currentSpot.x,
                        y: currentSpot.y,
                        dir: startingSpot.dir,
                    }

                    // is this spot banned? if it is we should just 
                    // end this line and not push more items onto the queue
                    if (bannedSpotsMap.get(currVec.x, currVec.y)) {
                        // yes
                        terminateLine = true
                        return false
                    }
                    // no, not banned
                    // let's ensure there's a road here
                    // is there anything in the way that's not a road?
                    const spotStruct = getStructureAt(room, currVec)
                    if (spotStruct && spotStruct.structureType != STRUCTURE_ROAD) {
                        // yes, terminate
                        terminateLine = true
                        return false
                    } else if (!spotStruct) {
                        // nope nothing there, let's build a road!
                        room.createConstructionSite(currVec.x, currVec.y, STRUCTURE_ROAD)
                    }

                    // let's build extensions!

                    // is this the middle spot?
                    if (spotIndex == 1) {
                        // yes
                        return // continue
                    }
                    // no, let's build extensions!
                    const left = getPosInRelDir(currVec, LEFT)
                    const right = getPosInRelDir(currVec, RIGHT)
                    _.each([left, right], sideSpot => {
                        // is there anything in the way?
                        const struct = getStructureAt(room, sideSpot)
                        if (struct && struct.structureType == STRUCTURE_ROAD) {
                            // yes and it's a road, destroy it
                            struct.destroy()
                        } else if (!struct) {
                            // nope, build an extension
                            const code = room.createConstructionSite(
                                sideSpot.x, sideSpot.y, STRUCTURE_EXTENSION)
                            if (code == ERR_RCL_NOT_ENOUGH) {
                                // failed, too many extensions, terminate
                                terminateEntirely = true
                                return false
                            }
                        }
                    })
                    // did we terminate?
                    if (terminateLine || terminateEntirely) {
                        return false
                    }
                }) // inline spots iteration loop

                // make sure to set visited
                const end = {
                    ...getPosInRelDir(startingSpot, FORWARD, 4),
                    dir: startingSpot.dir,
                }
                visitedSpotsMap.set(startingSpot.x, startingSpot.y, true)
                visitedSpotsMap.set(end.x, end.y, true)

                // did we terminate entirely?
                if (terminateEntirely) {
                    // yes
                    console.log("terminating entirely")
                    break
                } else if (terminateLine) {
                    // nope, just the line, don't push spots onto the queue
                    console.log("terminating line")
                    return
                } else {
                    console.log("Pushing more spots")
                    queue.push(end)
                    const left = getDirFrom(startingSpot.dir, LEFT)
                    queue.push({
                        x: end.x,
                        y: end.y,
                        dir: left
                    })
                    const right = getDirFrom(startingSpot.dir, RIGHT)
                    queue.push({
                        x: end.x,
                        y: end.y,
                        dir: right
                    })
                }
            } // main iteration loop
        }
    }
}

function getDirTransform(dir: ABS_DIRECTION) {
    if (dir == NORTH) {
        return {
            x: 0,
            y: -1,
        }
    } else if (dir == SOUTH) {
        return {
            x: 0,
            y: 1,
        }
    } else if (dir == EAST) {
        return {
            x: 1,
            y: 0,
        }
    } else if (dir == WEST) {
        return {
            x: -1,
            y: 0,
        }
    }
}

function getDirFrom(absDir: ABS_DIRECTION, relDir: REL_DIRECTION) {
    const error = () => {throw new Error("WTF IS THIS DIR")}
    if (relDir == FORWARD) return absDir
    switch (absDir) {
        case NORTH:
            switch (relDir) {
                case LEFT: return WEST
                case RIGHT: return EAST
                case BACKWARD: return SOUTH
                default: error()
            }
        case SOUTH:
            switch (relDir) {
                case LEFT: return EAST
                case RIGHT: return WEST
                case BACKWARD: return NORTH
                default: error()
            }
        case EAST:
            switch (relDir) {
                case LEFT: return NORTH
                case RIGHT: return SOUTH
                case BACKWARD: return WEST
                default: error()
            }
        case WEST:
            switch (relDir) {
                case LEFT: return SOUTH
                case RIGHT: return NORTH
                case BACKWARD: return EAST
                default: error()
            }
        default: error()
    }
}

function getPosInDir(pos: {x: number, y: number}, dir: ABS_DIRECTION, paces = 1) {
    return getPosInRelDirBase({dir: null, ...pos}, dir, paces, false)
}

function getPosInRelDir(vec: Vector, relDir: REL_DIRECTION, paces = 1) {
    return getPosInRelDirBase(vec, relDir, paces, true)
}

function getPosInRelDirBase(vec: Vector, dir: DIRECTION, paces: number, relative: boolean) {
    let direction = null as number
    if (relative) {
        direction = getDirFrom(vec.dir, dir)
    } else {
        direction = dir
    }
    const transform = getDirTransform(direction)
    return {
        x: vec.x + (paces * transform.x),
        y: vec.y + (paces * transform.y)
    }
}

function getStructureAt(room: Room, site: Site) {
    return room.lookForAt(LOOK_STRUCTURES, site.x, site.y)[0] as Structure
}

