import * as _ from 'lodash'

export function canSpawnBody(spawn: Spawn, body: string[]) {
    return spawn.spawnCreep(body, newName("test"), { dryRun: true }) == OK
}

export function newName(type: string) {
    return type + Game.time.toString()
}

export function getRoomMainSpawn(room: Room) {
    const spawns: Spawn[] = room.find(FIND_MY_SPAWNS)
    const spawn = spawns[0]
    return spawn
}

export function getRoomCreeps(room: Room) {
    const creeps: Creep[] = room.find(FIND_MY_CREEPS)
    return creeps
}

export function atEmptyEnergy(c: Creep) {
    return c.carry.energy == 0
}

export function atFullEnergy(c: Creep) {
    return c.carry.energy == c.carryCapacity
}

export function getRoomRoleCreeps(room: Room, role: string) {
    return _.filter(getRoomCreeps(room), c => c.memory.role == role)
}
