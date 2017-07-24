//@flow
import _ from 'lodash'
import * as t from './types'
import { getJobs } from './utils'

export const manageRoom = function(room: Room) {

    

    const spawn = getRoomSpawn(room)
    let result: any = ""

    if (shouldSpawnHarvester(room)) {
        // console.log('spawn harvester')
        result = spawnHarvester(spawn)
    } else if (shouldSpawnUpgrader(room)) {
        // console.log('spawn upgrader')
        result = spawnUpgrader(spawn)
    }
    // console.log(`result: ${result}`)

}

function getCreepsInRoom(room: Room) {
    const myCreeps: Creep[] = room.find(FIND_MY_CREEPS)
    return myCreeps    
}

function numberOfHarvesters(room: Room) {
    const myCreeps = getCreepsInRoom(room)
    return _.filter(myCreeps, c => c.memory.type == t.HARVESTER).length
}

function numberOfUpgraders(room: Room) {
    const myCreeps = getCreepsInRoom(room)
    return _.filter(myCreeps, c => c.memory.type == t.UPGRADER).length
}

function shouldSpawnHarvester(room: Room) {
    return numberOfHarvesters(room) < 3
}

function shouldSpawnUpgrader(room: Room) {
    return numberOfUpgraders(room) < 2
}

function getRoomSpawn(room: Room) {
    const spawns = room.find(FIND_MY_SPAWNS)
    return spawns[0]
}

function spawnHarvester(spawn: StructureSpawn): ERR_CONST {
    const harvesterJobs = _.filter(getJobs(), 
        (j: CreepJob) => j.type == t.HARVESTER && j.roomName == spawn.room.name)
    if (harvesterJobs.length > 0) {
        const selectedJob = harvesterJobs[0]
        const parts = [WORK, MOVE, CARRY]
        const memory = { 
            type: 'harvester',
            isHarvesting: false,
            jobID: selectedJob.id,
        }
        let result = spawn.canCreateCreep(parts)
        if (result == OK) {
            result = spawn.createCreep(parts, undefined, memory)
        }
    } else {
        result = -999
    }

    return result
}

function spawnUpgrader(spawn) {
    return ERR_BUSY
    // return spawn.createCreep([WORK, MOVE, CARRY], { type: 'upgrader' })
}
