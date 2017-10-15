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

export function moveAndHarvest(c: Creep, source: Source) {
    const code = c.harvest(source)
    if (code == ERR_NOT_IN_RANGE) {
        c.moveTo(source)
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
    const sites = getAreaSites(pos, 1)
    const clearSites = sites.filter(s => !s.structure && s.terrain != "wall")
    return clearSites.length
}

export function findDepot(room: Room): StructureContainer | StructureStorage {
    const spawn = getRoomMainSpawn(room)
    const structures = spawn.pos.findInRange(FIND_MY_STRUCTURES, 2) as Structure[]
    const relevantStructures = structures.filter(s => 
        s.structureType == STRUCTURE_STORAGE) as StructureStorage[]
    return _.first(relevantStructures)
}

function getRoomPosContainer(pos: RoomPosition) {
    const containers = _.filter(pos.findInRange(FIND_STRUCTURES, 2) as Structure[], 
        s => s.structureType == STRUCTURE_CONTAINER) as StructureContainer[]
    return _.first(containers)
}

export function getSourceContainer(source: Source) {
    return getRoomPosContainer(source.pos)
}

export function getControllerContainer(room: Room) {
    return getRoomPosContainer(room.controller.pos)
}

export function getSourceContainerConstructionSites(source: Source) {
    return getRoomPosConstructionSites(source.pos, 2)
}

export function getControllerContainerConstructionSites(room: Room) {
    return getRoomPosConstructionSites(room.controller.pos, 2)
}

function getRoomPosConstructionSites(pos: RoomPosition, range: number) {
    const constructionLocations = pos.findInRange(FIND_CONSTRUCTION_SITES, range) as ConstructionSite[]
    const containerConstructionLocations = 
        constructionLocations.filter(cl => cl.structureType == STRUCTURE_CONTAINER)
    return containerConstructionLocations
}

export function getAreaSites(pos: RoomPosition, range: number) {
    const room = Game.rooms[pos.roomName]
    const sites = room.lookAtArea(pos.y - range, pos.x - range, 
        pos.y + range, pos.x + range, true) as LookAtResultWithPos[]
    return normalizeLookObjects(sites)
}
