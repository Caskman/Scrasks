//@flow
const spawnCreeps = require('./creeps')
const cleanMemory = require('./utils')

exports.loop = function() {

    cleanMemory()
    spawnCreeps()

}
