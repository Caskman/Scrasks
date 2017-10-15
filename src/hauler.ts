import * as _ from 'lodash'
import * as ut from './utils'
import * as consts from './constants'

const HAULER_BODY = [MOVE,WORK,CARRY]
const HAULERS_PER_COLLECT_TARGET = 1
const HAULERS_PER_TRANSPORT_TARGET = 2

export function runHauler(c: Creep) {
    if (c.memory.hauling && ut.atEmptyEnergy(c)) {
        c.memory.hauling = false
    } else if (!c.memory.hauling && ut.atFullEnergy(c)) {
        c.memory.hauling = true
    }

    // what's my job?
    if (c.memory.job == consts.HAULER_COLLECT_JOB) {
        // job is collecting from source containers

        // are we hauling?
        if (c.memory.hauling) {
            // yes, is there a depot next to spawn?
            const depot = ut.findDepot(c.room)
            if (depot) {
                // yes, let's store there
                ut.moveAndTransfer(c, depot)
            } else {
                // no, is spawn full?
                if (ut.isSpawnFull(c.room)) {
                    // yes, let's build a depot

                    // do nothing for now until we get to the point of building storage

                    // are we currently building a depot?
                    /*
                    const depotConstructionSites = getDepotConstructionSites(c.room)
                    if (depotConstructionSites.length > 0) {
                        // yes, continue building depot
                        const depotSite = depotConstructionSites[0]
                        ut.moveAndBuild(c, depotSite)
                    } else {
                        // no, let's create one
                        const location = pickDepotConstructionSite(c.room)
                        c.room.createConstructionSite(location, STRUCTURE_CONTAINER)
                    }
                    */
                } else {
                    // no, let's store at spawn
                    ut.moveAndTransfer(c, ut.getRoomMainSpawn(c.room))
                }
            }
        } else {
            // no, let's get some energy
            const source = Game.getObjectById(c.memory.targetID) as StructureContainer
            ut.moveAndWithdraw(c, source)
        }
    } else if (c.memory.job == consts.HAULER_TRANSPORT_JOB) {
        if (c.memory.hauling) {
            // let's do some hauling
            const target = Game.getObjectById(c.memory.targetID) as Structure
            ut.moveAndTransfer(c, target)
        } else {
            // get some energy!

            // is there a depot?
            const depot = ut.findDepot(c.room)
            if (depot) {
                // yes, pull energy from that
                ut.moveAndWithdraw(c, depot)
            } else {
                // no, are there containers?
                const container = c.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (s: Structure) => 
                        s.structureType == STRUCTURE_CONTAINER
                        && s.id != c.memory.targetID
                }) as Structure
                if (container) {
                    ut.moveAndWithdraw(c, container)
                }
            }
        }
    } else {
        throw new Error("Upgrader has no job")
    }
}

export function spawnHaulers(room: Room) {
    const spawn = ut.getRoomMainSpawn(room)
    if (ut.canSpawnBody(spawn, HAULER_BODY)) {
        const sources = room.find(FIND_SOURCES) as Source[]
        let jobTargets = sources.map(s => ut.getSourceContainer(s))
        jobTargets = jobTargets.filter(jt => !!jt)
        const jobs = jobTargets.map(jt => {
            return {
                targetID: jt.id,
                job: consts.HAULER_COLLECT_JOB,
                creeps: [] as Creep[],
            }
        })

        const controllerContainer = ut.getControllerContainer(room)
        if (controllerContainer) {
            jobs.push({
                targetID: controllerContainer.id,
                job: consts.HAULER_TRANSPORT_JOB,
                creeps: []
            })
        }
    
        const haulers = ut.getRoomRoleCreeps(room, consts.HAULER_ROLE)
        haulers.forEach(h => {
            const job = _.find(jobs, {targetID: h.memory.targetID})
            job.creeps.push(h)
        })
    
        const underStaffedJobs = jobs.filter(j => j.creeps.length < HAULERS_PER_COLLECT_TARGET)

        if (underStaffedJobs.length > 0) {
            const job = underStaffedJobs[0]
            spawn.spawnCreep(HAULER_BODY, ut.newName(consts.HAULER_ROLE), {memory: {
                role: consts.HAULER_ROLE,
                job: job.job,
                targetID: job.targetID,
            }})
        }
    }
}

function getDepotConstructionSites(room: Room) {
    const spawn = ut.getRoomMainSpawn(room)
    const constructionSites = spawn.pos
        .findInRange(FIND_CONSTRUCTION_SITES, 2) as ConstructionSite[]
    const depotConstructionSites = constructionSites
        .filter(s => s.structureType == STRUCTURE_CONTAINER
            || s.structureType == STRUCTURE_STORAGE)
    return depotConstructionSites
}

function pickDepotConstructionSite(room: Room): RoomPosition {
    const spawn = ut.getRoomMainSpawn(room)
    const pos = spawn.pos
    const sites = ut.getAreaSites(pos, 2)
    const unoccupiedSites = sites.filter(s => !s.structure && s.terrain != "wall")
    const openestSites = _.sortBy(unoccupiedSites, s => ut.getClearance(room.getPositionAt(s.x, s.y)))
    const site = openestSites[openestSites.length - 1]
    return room.getPositionAt(site.x, site.y)
}

