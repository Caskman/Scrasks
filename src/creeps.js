//@flow
import _ from 'lodash'
import * as t from './types'
import { getJob, getHarvesterJob, getJobs, byID } from './utils'

export function manageCreeps() {

    _.each(Game.creeps, (c: Creep) => {
        // console.log(`Name: ${c.name}; type: ${c.memory.type}`)

        if (c.memory.type == t.HARVESTER) {
            runHarvester(c)
        } else if (c.memory.type == t.UPGRADER) {
            runUpgrader(c)
        }

    })
}

// creep type runners

function runHarvester(creep: Creep) {
    const props = getHarvesterProps(creep)
    
    if (props.isHarvesting && isCreepFull(creep)) {
        props.isHarvesting = false
    } else if (!props.isHarvesting && isCreepEnergyEmpty(creep)) {
        props.isHarvesting = true
    }

    const job = getHarvesterJob(props.jobID)
    if (props.isHarvesting) {
        const source = (byID(job.sourceID): Source)
        if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
            creep.moveTo(source)
        }
    } else {
        const depot = (byID(job.destID): StructureSpawn)
        if (creep.transfer(depot, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(depot)
        }
    }
}

function runUpgrader(creep: Creep) {
    const props = getUpgraderProps(creep)
    
    if (props.isUpgrading && isCreepEnergyEmpty(creep)) {
        props.isUpgrading = false
    } else if (!props.isUpgrading && isCreepFull(creep)) {
        props.isUpgrading = true
    }
}

// Refinement

function getHarvesterProps(creep: Creep): HarvesterProps {
    if (creep.memory.type === t.HARVESTER) {
        return ((creep.memory: any): HarvesterProps)
    } else {
        throw 'Harvester memory problem'
    }
}

function getUpgraderProps(creep: Creep): UpgraderProps {
    if (creep.memory.type === t.UPGRADER) {
        return ((creep.memory: any): UpgraderProps)
    } else {
        throw 'Upgrader memory problem'
    }
}

// Util functions

function isCreepEnergyEmpty(creep: Creep) {
    return creep.carry[RESOURCE_ENERGY] == 0
}

function isCreepFull(creep: Creep) {
    return _.reduce(creep.carry, (s, v) => s + v, 0) == creep.carryCapacity
}
