import * as _ from 'lodash'
import * as consts from './constants'

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

export function moveAndRepair(c: Creep, struct: Structure) {
    const code = c.repair(struct)
    if (code == ERR_NOT_IN_RANGE) {
        c.moveTo(struct)
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
            constructionSite: null as ConstructionSite,
        }
        return g.reduce((s, o) => {
            if (o.type == "creep") {
                s.creep = o.creep
            } else if (o.type == "structure") {
                s.structure = o.structure
            } else if (o.type == "terrain") {
                s.terrain = o.terrain
            } else if (o.type == "constructionSite") {
                s.constructionSite = o.constructionSite
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

export function findContainerDepot(room: Room): StructureContainer {
    const spawn = getRoomMainSpawn(room)
    const structures = spawn.pos.findInRange(FIND_STRUCTURES, 2, 
        {filter: (s: Structure) => 
            s.structureType == STRUCTURE_CONTAINER
        }) as StructureContainer[]
    return structures[0]
}

export function findStorageDepot(room: Room): StructureStorage {
    const spawn = getRoomMainSpawn(room)
    const structures = spawn.pos.findInRange(FIND_STRUCTURES, 2, 
        {filter: (s: Structure) => 
            s.structureType == STRUCTURE_STORAGE
        }) as StructureStorage[]
    return structures[0]
}

export function depotExists(room: Room) {
    return !!findContainerDepot(room) || !!findStorageDepot(room)
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

export function getEnergyQuickly(c: Creep) {
    const energyRepo = c.pos.findClosestByRange(FIND_STRUCTURES, {filter: (s: Structure) => {
        const store = s as (StructureContainer | StructureStorage)
        return (
            store.structureType == STRUCTURE_STORAGE 
            || store.structureType == STRUCTURE_CONTAINER
        )
        && store.store.energy > 0
    }}) as (StructureContainer | StructureStorage)

    // is there an energy repo?
    if (energyRepo) {
        // yes
        moveAndWithdraw(c, energyRepo)
    } else {
        // no, go gather your energy!
        const source = c.pos.findClosestByRange(FIND_SOURCES_ACTIVE) as Source
        moveAndHarvest(c, source)
    }
}

export function getEnergyFromBase(c: Creep, exclude = [] as string[]) {
    // depot?
    const storage = findStorageDepot(c.room)
    if (
        storage && storage.store.energy > 0 
        && !_.includes(exclude, storage.id)
    ) {
        moveAndWithdraw(c, storage)
    } else {
        const container = findContainerDepot(c.room)
        if (
            container && container.store.energy > 0 
            && !_.includes(exclude, container.id)
        ) {
            moveAndWithdraw(c, container)
        } else {
            const container = c.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (s: Structure) => 
                    s.structureType == STRUCTURE_CONTAINER
                    && !_.includes(exclude, s.id)
                    && (s as StructureContainer).store.energy > 0
            }) as StructureContainer
            if (container) {
                moveAndWithdraw(c, container)
            }
        }
    }
}

export function storeEnergyAtBase(c: Creep) {
    // is spawn full?
    const spawn = getRoomMainSpawn(c.room)
    if (!isSpawnFull(c.room)) {
        // nope, store in it
        moveAndTransfer(c, spawn)
    } else {
        // yes, is there a depot?
        const storage = findStorageDepot(c.room)
        if (storage) {
            moveAndTransfer(c, storage)
        } else {
            const container = findContainerDepot(c.room)
            moveAndTransfer(c, container)
        }
    }
}

export function storeInSpawn(c: Creep) {
    const spawn = getRoomMainSpawn(c.room)
    moveAndTransfer(c, spawn)
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
    for (let x = pos.x - radius; x <= pos.x + radius; x++) {
        for (let y = pos.y - radius; y <= pos.y + radius; y++) {
            if (x != pos.x || y != pos.y) {
                sites.push({x, y})
            }
        }
    }
    return sites
}

export function manhattanDist(ax: number, ay: number, bx: number, by: number) {
    return Math.abs(ax - bx) + Math.abs(ay - by)
}

export function getValidSources(room: Room) {
    return (room.find(FIND_SOURCES) as Source[])
        .filter(s => s.pos.findInRange(FIND_HOSTILE_STRUCTURES, 10).length == 0)
}

function getSourceStaffInfo(room: Room, fullyStaffed: boolean) {
    const harvesters = _.filter(getRoomCreeps(room), c => c.memory.role == consts.HARVESTER_ROLE)
    const sourceJobs = getValidSources(room)
        .map(s => {
            return {
                sourceID: s.id,
                creeps: harvesters.filter(h => h.memory.sourceID == s.id)
            }
        })
    const staffingLevel = desiredSourceHarvesterStaffingLevel(room)
    if (fullyStaffed) {
        return sourceJobs.filter(sj => sj.creeps.length == staffingLevel)
    } else {
        return sourceJobs.filter(sj => sj.creeps.length < staffingLevel)
    }
}

function desiredSourceHarvesterStaffingLevel(room: Room) {
    if (sourcesHaveContainers(room)) {
        return consts.BASIC_INFRA_HARVESTERS_PER_SOURCE
    } else {
        return consts.BARE_BONES_HARVESTERS_PER_SOURCE
    }
}

export function getUnderStaffedSources(room: Room) {
    return getSourceStaffInfo(room, false)
}

export function getFullyStaffedSources(room: Room) {
    return getSourceStaffInfo(room, true)
    
}

export function sourcesHaveContainers(room: Room) {
    return getValidSources(room)
        .filter(s => !getSourceContainer(s)).length == 0
}

export function containerHasHauler(container: StructureContainer) {
    const haulers = getRoomRoleCreeps(container.room, consts.HAULER_ROLE)
    return haulers.some(h => h.memory.targetID == container.id)
}

export function anyRoadConstructionSites(room: Room) {
    return room.find(FIND_CONSTRUCTION_SITES, {filter: (s: Structure) => 
        s.structureType == STRUCTURE_ROAD}).length > 0
}
