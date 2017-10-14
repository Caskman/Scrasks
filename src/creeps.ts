import * as _ from 'lodash'

const HARVESTER_ROLE = "HARVESTER"
const HARVESTER_BODY = [MOVE,WORK,CARRY]

const UPGRADER_ROLE = "UPGRADER"
const UPGRADER_BODY = [MOVE,WORK,CARRY]


export function manageCreeps(room: Room) {

    const spawns: Spawn[] = room.find(FIND_MY_SPAWNS)
    const spawn = spawns[0]

    spawnHarvesters(room)
    spawnUpgraders(room)

    runCreeps(room)
}

function runCreeps(room: Room) {
    _.each(getRoomCreeps(room), c => {
        if (c.memory.role == HARVESTER_ROLE) {
            runHarvester(c)
        } else if (c.memory.role == UPGRADER_ROLE) {
            runUpgrader(c)
        }
    })
}

function runHarvester(c: Creep) {
    if (c.memory["hauling"] && atEmptyEnergy(c)) {
        c.memory["hauling"] = false
    } else if (!c.memory["hauling"] && atFullEnergy(c)) {
        c.memory["hauling"] = true
    }

    if (c.memory["hauling"]) {
        const dest: Structure = Game.getObjectById(c.memory.destID)
        if (c.transfer(dest, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            c.moveTo(dest)
        }
    } else {
        const source: Source = Game.getObjectById(c.memory.sourceID)
        const code = c.harvest(source)
        if (code == ERR_NOT_IN_RANGE) {
            c.moveTo(source)
        }
    }
}

function runUpgrader(c: Creep) {
    if (c.memory.upgrading && atEmptyEnergy(c)) {
        c.memory.upgrading = false
    } else if (!c.memory.upgrading && atFullEnergy(c)) {
        c.memory.upgrading = true
    }

    if (c.memory.upgrading) {
        const controller = c.room.controller
        if (c.upgradeController(controller) == ERR_NOT_IN_RANGE) {
            c.moveTo(controller)
        }
    } else {
        const source: Source = c.pos.findClosestByRange(FIND_SOURCES_ACTIVE)
        if (source) {
            if (c.harvest(source) == ERR_NOT_IN_RANGE) {
                c.moveTo(source)
            }
        } else {
            throw new Error("why no sources for controller?")
        }
    }
}

function spawnHarvesters(room: Room) {
    const spawn = getRoomMainSpawn(room)
    if (canSpawnBody(spawn, HARVESTER_BODY)) {
        type SourceObj = {
            sourceID: string,
            creeps: Creep[]
        }

        const harvesters = _.filter(getRoomCreeps(room), c => c.memory.role == HARVESTER_ROLE)
        const sources: Source[] = room.find(FIND_SOURCES)
        const sourceObjs: SourceObj[] = sources.map(s => {
            return {
                sourceID: s.id,
                creeps: []
            }
        })
        const sourceGroups = _.groupBy(harvesters, c => c.memory.sourceID)
        _.each(sourceGroups, (cs, sourceID) => {
            const obj = _.find(sourceObjs, {sourceID})
            if (obj) {
                obj.creeps = cs
            }
        })
        const underStaffedSources = _.filter(sourceObjs, so => so.creeps.length < 2)
        if (underStaffedSources.length > 0) {
            const sourceID = _.map(underStaffedSources, so => so.sourceID)[0]
            spawn.spawnCreep(HARVESTER_BODY, newName(HARVESTER_ROLE), {
                memory: {
                    role: HARVESTER_ROLE,
                    sourceID,
                    destID: spawn.id,
                }
            })
        }
    }

}

function spawnUpgraders(room: Room) {
    const spawn = getRoomMainSpawn(room)
    const upgraders = _.filter(getRoomCreeps(room), c => c.memory.role == UPGRADER_ROLE)
    if (upgraders.length < 1 && canSpawnBody(spawn, UPGRADER_BODY)) {
        spawn.spawnCreep(UPGRADER_BODY, newName(UPGRADER_ROLE), {memory: {
            role: UPGRADER_ROLE,
        }})
    }
}

function canSpawnBody(spawn: Spawn, body: string[]) {
    return spawn.spawnCreep(body, newName("test"), { dryRun: true }) == OK
}

function newName(type: string) {
    return type + Game.time.toString()
}

function getRoomMainSpawn(room: Room) {
    const spawns: Spawn[] = room.find(FIND_MY_SPAWNS)
    const spawn = spawns[0]
    return spawn
}

function getRoomCreeps(room: Room) {
    const creeps: Creep[] = room.find(FIND_MY_CREEPS)
    return creeps
}

function atEmptyEnergy(c: Creep) {
    return c.carry.energy == 0
}

function atFullEnergy(c: Creep) {
    return c.carry.energy == c.carryCapacity
}
