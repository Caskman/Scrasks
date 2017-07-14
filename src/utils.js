//@flow
import { Game, Memory } from './cask-screeps'
import _ from 'lodash'

export function cleanMemory() {
    _.flow([
        creepObjs => _.filter(creepObjs, o => !Game.creeps[o.name]),
        deadCreeps => _.each(deadCreeps, c => delete Memory.creeps[c.name])
    ])(Memory.creeps)
}
