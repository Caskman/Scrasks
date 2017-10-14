import * as _ from 'lodash'

const WORKER_BODY = [MOVE,WORK,CARRY]
const HARVESTER_ROLE = "HARVESTER"
    

export function manageCreeps(spawn: Spawn) {
    if (spawn.spawnCreep(WORKER_BODY, newName(HARVESTER_ROLE), { dryRun: true }) == OK) {
        type SourceObj = {
            sourceID: string,
            creeps: Creep[]
        }

        const harvesters = _.filter(Game.creeps, c => c.memory.role == HARVESTER_ROLE)
        const sources: Source[] = _.values(Game.rooms)[0].find(FIND_SOURCES)
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
            spawn.spawnCreep(WORKER_BODY, newName(HARVESTER_ROLE), {
                memory: {
                    role: HARVESTER_ROLE,
                    sourceID,
                    destID: spawn.id,
                }
            })
        }
    }

    _.each(Game.creeps, c => {
        if (c.memory.role == HARVESTER_ROLE) {
            if (c.memory["hauling"] && c.carry.energy == 0) {
                c.memory["hauling"] = false
            } else if (!c.memory["hauling"] && c.carry.energy == c.carryCapacity) {
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
    })
}

function newName(type: string) {
    return type + Game.time.toString()
}
