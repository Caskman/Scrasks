import * as _ from 'lodash'
import { manageCreeps } from './creeps'
import * as ut from './utils'

/**
 * TODOS
 * 
 * consider if it's better to have dedicated builders instead of everybody constructing
 * get container placement to be closer to spawn and create code to help with breaking ties
 * add extension creation
 * add body modulation
 * add worker count flexibility
 * 
 */

export const loop = function() {

    cleanCreeps()

    const room = _.values(Game.rooms)[0] as Room
    
    if (Game.time % 53) {
        checkExtensions(room)
    }

    if (Game.time % 23 == 0) {
        checkRoads(room)
    }


    manageCreeps(room)

}

function cleanCreeps() {
    const memoryCreeps = _.keys(Memory.creeps)
    const existingCreeps = _.keys(Game.creeps)
    const dirtyCreeps = _.difference(memoryCreeps, existingCreeps)
    dirtyCreeps.forEach(c => delete Memory.creeps[c])
}

function checkRoads(room: Room) {
    const roadConstructionSites = room.find(FIND_CONSTRUCTION_SITES, 
        {filter: (s: Structure) => s.structureType == STRUCTURE_ROAD})
    if (roadConstructionSites.length == 0) {
        const containers = room.find(FIND_STRUCTURES, {filter: 
            (s: Structure) => s.structureType == STRUCTURE_CONTAINER}) as StructureContainer[]
        const spawn = ut.getRoomMainSpawn(room)
        containers.forEach(c => {
            const path = spawn.pos.findPathTo(c.pos, {
                ignoreCreeps: true,
            })
            path.forEach(ps => {
                const pos = room.getPositionAt(ps.x, ps.y)
                pos.createConstructionSite(STRUCTURE_ROAD)
            })
        })
    }
}

function checkExtensions(room: Room) {
    // can we build more extensions?
    const extensions = room.find(FIND_STRUCTURES,
        {filter: (s: Structure) => s.structureType == STRUCTURE_EXTENSION}) as StructureExtension[]
    

    // are there extension construction sites?
    const extConstructSites = room.find(FIND_CONSTRUCTION_SITES, 
        {filter: (s: Structure) => s.structureType == STRUCTURE_EXTENSION}) as ConstructionSite[]
    if (extConstructSites.length == 0) {
        // no, let's build some

    }
}

