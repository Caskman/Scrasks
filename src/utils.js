//@flow
import _ from 'lodash'
import * as t from './types'

export function cleanMemory() {
    _.chain(Memory.creeps)
    .filter(o => !Game.creeps[o.name])
    .each(c => delete Memory.creeps[c.name])
}

export function getJobs(): JobsCollection {
    return Memory.jobs
}

export function getJob(id: JobID): CreepJob {
    let jobs = Memory.jobs
    return jobs[id]
}

export function getHarvesterJob(id: JobID): HarvesterJob {
    const job = getJob(id)
    if (job.type == t.HARVESTER) {
        return ((job: any): HarvesterJob)
    } else {
        throw 'harvester job refiner error'
    }
}

export function byID(id: ObjectID) {
    return Game.getObjectById(id)
}
