//@flow


// Global Objects

declare var Game: {
    spawns: { [string]: StructureSpawn},
    creeps: { [string]: Creep},

}

declare var Memory: {
    spawns: { [string]: StructureSpawn },
    creeps: { [string]: Creep },
    rooms: { [string]: Room },
    flags: { [string]: Flag },
}

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

}

declare type RoomObject = {
    pos: RoomPosition,
    room: Room,
}

declare type Source = {
    ...RoomObject,
    
}

declare type Structure = {

}

declare type StructureSpawn = {
    ...OwnedStructure,
    ...RoomObject,
    ...Structure,
    energy: number,
}


export { Game, Memory }