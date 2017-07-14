// var mock = require('mock-require')
var assert = require('assert')
var mock = require('mock-require')
var mockCaskScreeps = require('./cask-screeps')

mock('../cask-screeps', mockCaskScreeps)

var creeps = require('../creeps')


describe('Something', function() {
    it('should do something good and well', function() {
        assert.equal(2, 2)
    })

    it('should verify that my api works', function() {
        assert.equal(creeps.spawnCreeps(), 5)
    })
})


