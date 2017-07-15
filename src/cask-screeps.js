//@flow

const GameMM: GameType = {
    creeps: Game.creeps,
    spawns: Game.spawns,
    rooms: Game.rooms,
}
const MemoryMM: MemoryType = {
    spawns: Memory.spawns,
    creeps: Memory.creeps,
    rooms: Memory.rooms,
    flags: Memory.flags,
}

export { GameMM as Game, MemoryMM as Memory }