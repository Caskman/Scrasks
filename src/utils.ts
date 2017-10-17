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
    const containers = pos.findInRange(FIND_STRUCTURES, 2,
        {filter: (s: Structure) => s.structureType == STRUCTURE_CONTAINER}) as StructureContainer[]
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

export function getEnergyFromAnywhere(c: Creep) {
    // is there a depot?
    const depot = findDepot(c.room)
    if (depot) {
        // yes, pull energy from that
        moveAndWithdraw(c, depot)
    } else {
        // no, are there containers?
        const container = c.pos.findClosestByRange(FIND_STRUCTURES, {filter: 
            (s: Structure) => s.structureType == STRUCTURE_CONTAINER
                && (s as StructureContainer).store.energy > 0}) as StructureContainer
        
        if (container) {
            // yes, pull from closest container
            moveAndWithdraw(c, container)
        } else {
            // no, pull from a source
            const source: Source = c.pos.findClosestByRange(FIND_SOURCES_ACTIVE)
            moveAndHarvest(c, source)
        }
    }
}

export function getHighestScoring<T>(collection: ArrayLike<T>, scoringFn: (e: T) => number): T[] {
    return getBestScoring(collection, scoringFn, true)
}

export function getLowestScoring<T>(collection: ArrayLike<T>, scoringFn: (e: T) => number): T[] {
    return getBestScoring(collection, scoringFn, false)
}

function getBestScoring<T>(collection: ArrayLike<T>, scoringFn: (e: T) => number, max: boolean): T[] {
    const scores = _.map(collection, s => {
        return {
            score: scoringFn(s),
            site: s,
        }
    })
    let bestScore: number = null
    if (max) {
        bestScore = _.max(scores, "score").score
    } else {
        bestScore = _.min(scores, "score").score
    }
    const bestScoring = scores.filter(s => s.score == bestScore).map(s => s.site)
    return bestScoring
}

export function hasBasicInfra(room: Room) {
    const sources = room.find(FIND_SOURCES) as Source[]
    const builtUpSources = sources.filter(s => !!getSourceContainer(s))
    return sources.length == builtUpSources.length
}

export function getBodyCost(body: string[]) {
    return _.sum(body.map(b => BODYPART_COST[b]))
}

export function getSpawnCapacity(room: Room) {
    const spawn = getRoomMainSpawn(room)
    const extensions = room.find(FIND_STRUCTURES,
        {filter: (s: Structure) => s.structureType == STRUCTURE_EXTENSION}) as StructureExtension[]
    const extensionsCap = (EXTENSION_ENERGY_CAPACITY as {[l: number]: number})[room.controller.level]
    return SPAWN_ENERGY_CAPACITY + extensions.length * extensionsCap
}

export function forN(count: number, fn: (index: number) => any) {
    for (let i = 0; i < count; i++) {
        const result = fn(i)
        if (result === false) {
            break
        }
    }
}

export function fillBody(room: Room, incomingBody: string[], filler: string[]) {
    let body = [...incomingBody]
    const cost = getBodyCost(body)
    const spawnCap = getSpawnCapacity(room)
    const spare = spawnCap - cost
    const fillerCost = getBodyCost(filler)
    const extraWorkCount = Math.floor(spare / fillerCost)
    forN(extraWorkCount, i => {
        body = body.concat(filler)
    })
    return body
}

export function createAreaListFrom(pos: RoomPosition, radius: number) {
    const sites = [] as {
        x: number,
        y: number,
    }[]
    for (let x = pos.x - radius; x < pos.x + radius; x++) {
        for (let y = pos.y - radius; y < pos.y + radius; y++) {
            sites.push({x, y})
        }
    }
    return sites
}

export function manhattanDist(ax: number, ay: number, bx: number, by: number) {
    return Math.abs(ax - bx) + Math.abs(ay - by)
}

