//@flow
import { Game, Memory } from './cask-screeps'
import _ from 'lodash'

export const manageRoom = function(room: Room) {

    const spawn = getRoomSpawn(room)

    if (shouldSpawnHarvester(room)) {
        spawnHarvester(spawn)
    } else if (shouldSpawnUpgrader(room)) {
        spawnUpgrader(spawn)
    }

}

function numberOfHarvesters(room) {
    
}

function shouldSpawnHarvester(room) {
    return numberOfHarvesters(room) < 3
}

function shouldSpawnUpgrader(room) {
    return numberOfUpgraders(room) < 2
}

function getRoomSpawn(room) {
    return _.find(Game.spawns, s => s.room.name == room.name)
}

function spawnHarvester(spawn) {
    return spawn.createCreep(['WORK','MOVE','CARRY'], undefined, { type: 'harvester' }) <= 0
}

function spawnUpgrader(spawn) {
    return spawn.createCreep(['WORK','MOVE','CARRY'], undefined, { type: 'upgrader' }) <= 0
}
