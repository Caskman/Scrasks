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

export function isSpawnFull(room: Room) {
    const spawn = getRoomMainSpawn(room)
    return spawn.energy == spawn.energyCapacity
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

export function moveAndTransfer(c: Creep, dest: Structure) {
    const code = c.transfer(dest, RESOURCE_ENERGY)
    if (code == ERR_NOT_IN_RANGE) {
        c.moveTo(dest)
    }
    return code
}

export function moveAndWithdraw(c: Creep, dest: Structure) {
    const code = c.withdraw(dest, RESOURCE_ENERGY)
    if (code == ERR_NOT_IN_RANGE) {
        c.moveTo(dest)
    }
    return code
}

export function moveAndBuild(c: Creep, dest: ConstructionSite) {
    const code = c.build(dest)
    if (code == ERR_NOT_IN_RANGE) {
        c.moveTo(dest)
    }
    return code
}

export function normalizeLookObjects(objs: LookAtResultWithPos[]) {
    const groups = _.groupBy(objs, t => t.x + "," + t.y)
    const sites = _.map(groups, g => {
        const site = {
            x: g[0].x,
            y: g[0].y,
            creep: null as Creep,
            structure: null as Structure,
            terrain: null as string,
        }
        return g.reduce((s, o) => {
            if (o.type == "creep") {
                s.creep = o.creep
            } else if (o.type == "structure") {
                s.structure = o.structure
            } else if (o.type == "terrain") {
                s.terrain = o.terrain
            }
            return s
        }, site)
    })
    return sites
}

export function getClearance(pos: RoomPosition) {
    const room = Game.rooms[pos.roomName]
    const objs = room.lookAtArea(pos.y - 1, pos.x - 1, 
        pos.y + 1, pos.x + 1, true) as LookAtResultWithPos[]
    const sites = normalizeLookObjects(objs)
    const clearSites = sites.filter(s => !s.structure && s.terrain != "wall")
    return clearSites.length
}

export function findDepot(room: Room): StructureContainer | StructureStorage {
    const spawn = getRoomMainSpawn(room)
    const structures = spawn.pos.findInRange(FIND_MY_STRUCTURES, 2) as Structure[]
    const relevantStructures = structures.filter(s => s.structureType == STRUCTURE_CONTAINER
        || s.structureType == STRUCTURE_STORAGE)
    if (relevantStructures.length > 0) {
        const storage = _.find(relevantStructures, {structureType: STRUCTURE_STORAGE}) as StructureStorage
        if (storage) {
            return storage
        } else {
            return relevantStructures[0] as StructureContainer
        }
    } else {
        return null
    }
}

export function getSourceContainer(source: Source) {
    const containers = _.filter(source.pos.findInRange(FIND_STRUCTURES, 2) as Structure[], 
        s => s.structureType == STRUCTURE_CONTAINER) as StructureContainer[]
    return _.first(containers)
}
