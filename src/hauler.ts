import * as _ from 'lodash'
import * as ut from './utils'
import * as consts from './constants'

export function runHauler(c: Creep) {
    if (c.memory.hauling && ut.atEmptyEnergy(c)) {
        c.memory.hauling = false
    } else if (!c.memory.hauling && ut.atFullEnergy(c)) {
        c.memory.hauling = true
    }

    if (!Game.getObjectById(c.memory.targetID)) {
        // oh no! target doesn't exist anymore
        // find a new target or perish...
        const haulerJobs = getUnderstaffedHaulerJobs(c.room)
        if (haulerJobs.length > 0) {
            c.memory.targetID = haulerJobs[0].targetID
        } else {
            c.suicide()
            return
        }
    }

    // what's my job?
    if (c.memory.job == consts.HAULER_COLLECT_JOB) {
        // job is collecting from source containers
        runCollectJob(c)
    } else if (c.memory.job == consts.HAULER_TRANSPORT_JOB) {
        // job is transporting energy elsewhere
        runTransportJob(c)
    } else if (c.memory.job == consts.HAULER_CUSTODIAN_JOB) {
        // job is transporting energy elsewhere
        runCustodianJob(c)
    } else {
        throw new Error("Hauler has no job")
    }
}

function runTransportJob(c: Creep) {
    if (c.memory.hauling) {
        // let's do some hauling
        const target = Game.getObjectById(c.memory.targetID) as Structure
        ut.moveAndTransfer(c, target)
    } else {
        // get some energy!
        ut.getEnergyFromBase(c, [c.memory.targetID])
    }
}

function runCollectJob(c: Creep) {
    // are we hauling?
    if (c.memory.hauling) {
        // yes, is there a depot next to spawn?
        ut.storeEnergyAtBase(c)
    } else {
        // no, let's get some energy
        const source = Game.getObjectById(c.memory.targetID) as StructureContainer
        ut.moveAndWithdraw(c, source)
    }
}

function runCustodianJob(c: Creep) {
    if (c.memory.hauling) {
        ut.storeInSpawn(c)
    } else {
        ut.getEnergyFromBase(c)
    }
}

export function spawnHaulers(room: Room): number {
    let targetBody = ut.fillBody(room, [MOVE], [CARRY])
    
    const spawn = ut.getRoomMainSpawn(room)
    if (ut.canSpawnBody(spawn, targetBody)) {

        const underStaffedJobs = getUnderstaffedHaulerJobs(room)
        if (underStaffedJobs.length > 0) {
            const job = underStaffedJobs[0]
            return spawn.spawnCreep(targetBody, ut.newName(consts.HAULER_ROLE), {memory: {
                role: consts.HAULER_ROLE,
                job: job.job,
                targetID: job.targetID,
            }})
        }
    }
}

function getUnderstaffedHaulerJobs(room: Room) {
    const sources = room.find(FIND_SOURCES) as Source[]
    let jobTargets = sources.map(s => ut.getSourceContainer(s))
    jobTargets = _.uniq(jobTargets.filter(jt => !!jt), jt => jt.id)
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

    if (ut.depotExists(room)) {
        jobs.push({
            targetID: ut.getRoomMainSpawn(room).id,
            job: consts.HAULER_CUSTODIAN_JOB,
            creeps: [],
        })
    }

    const haulers = ut.getRoomRoleCreeps(room, consts.HAULER_ROLE)
    haulers.forEach(h => {
        const job = _.find(jobs, {targetID: h.memory.targetID})
        job.creeps.push(h)
    })
    const underStaffedJobs = jobs.filter(j => 
        (
            j.job == consts.HAULER_COLLECT_JOB
                && j.creeps.length < consts.HAULERS_PER_COLLECT_TARGET
        )
        || (
            j.job == consts.HAULER_TRANSPORT_JOB
                && j.creeps.length < consts.HAULERS_PER_TRANSPORT_TARGET
        )
        || (
            j.job == consts.HAULER_CUSTODIAN_JOB
                && j.creeps.length < consts.HAULERS_PER_CUSTODIAN_TARGET
        )
    )
    return underStaffedJobs
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

