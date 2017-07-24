
// Global Objects

declare type JobsCollection = { [JobID]: CreepJob };

declare class GameType {
    spawns: { [string]: StructureSpawn };
    creeps: { [string]: Creep };
    rooms: { [string]: Room };
    getObjectById(id: ObjectID): any;
}

declare var Game: GameType

declare class MemoryType {
    spawns: { [string]: StructureSpawn };
    creeps: { [string]: Creep };
    rooms: { [string]: Room };
    flags: { [string]: Flag };
    
    // Cask-specific memory props
    jobs: JobsCollection;
}

declare var Memory: MemoryType

// Types

declare class ConstructionSite {

}

declare class Creep extends RoomObject {
    memory: CreepMemory;
    carry: { [RESOURCE_CONST]: number };
    carryCapacity: number;
    harvest(target: Source | Mineral): ERR_CONST;
    moveTo(x: number, y: number, opts?: any): ERR_CONST;
    moveTo(target: RoomObject, opts?: any): ERR_CONST;
    transfer(target: Creep | Structure, resourceType: RESOURCE_CONST, amount?: number): ERR_CONST;
}

declare class Flag {

}

declare class Mineral extends RoomObject {

}

declare class OwnedStructure extends Structure {
    my: boolean;
}

declare class Room {
    controller: StructureController;
    energyAvailable: number;
    memory: any;
    mode: string;
    name: string;
    storage: StructureStorage;
    terminal: StructureTerminal;
    visual: RoomVisual;
    find(type: number, opts?: number[]): any[];
}

declare class RoomObject {
    pos: RoomPosition;
    room: Room;
}

declare class RoomPosition {

}

declare class RoomVisual {

}

declare class Source extends RoomObject {
    
}

declare class Structure extends RoomObject {
    hits: number;
    hitsMax: number;
    id: ObjectID;
    structureType: Struct_Const;
}

declare class StructureController {

}

declare class StructureSpawn extends OwnedStructure {
    energy: number;
    createCreep(body: CREEP_BODY_PART[], name?: string, memory: CreepMemory): ERR_CONST;
    canCreateCreep(body: CREEP_BODY_PART[], name?: string): ERR_CONST;
}

declare type StructureStorage = {

}

declare type StructureTerminal = {

}
