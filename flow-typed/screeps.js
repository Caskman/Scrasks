
// Global Objects

declare type GameType = {
    spawns: { [string]: StructureSpawn },
    creeps: { [string]: Creep },
    rooms: { [string]: Room }
}

declare var Game: GameType

declare type MemoryType = {
    spawns: { [string]: StructureSpawn },
    creeps: { [string]: Creep },
    rooms: { [string]: Room },
    flags: { [string]: Flag },
}

declare var Memory: MemoryType

// Types

declare type ConstructionSite = {

}

declare type Creep = {
    ...RoomObject,
}

declare type Flag = {

}

declare type OwnedStructure = {
    my: boolean,
}

declare type RoomPosition = {

}

declare type Room = {
    controller: StructureController,
    energyAvailable: number,
    memory: any,
    mode: string,
    name: string,
    storage: StructureStorage,
    terminal: StructureTerminal,
    visual: RoomVisual,
}

declare type RoomObject = {
    pos: RoomPosition,
    room: Room,
}

declare type RoomVisual = {

}

declare type Source = {
    ...RoomObject,
    
}

declare type Structure = {

}

declare type StructureController = {

}

declare type StructureSpawn = {
    ...OwnedStructure,
    ...RoomObject,
    ...Structure,
    energy: number,
    createCreep(body: string[], name?: string, memory: mixed): number,
}

declare type StructureStorage = {

}

declare type StructureTerminal = {

}
