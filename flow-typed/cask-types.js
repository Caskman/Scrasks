
declare type CreepType = string
declare type ObjectID = string
declare type JobID = number
declare type CreepJobType = string

declare class CreepMemory {
    type: CreepType
}

declare class HarvesterProps extends CreepMemory {
    jobID: JobID;
    sourceID: ObjectID;
    destID: ObjectID;
    isHarvesting: boolean;
}

declare class UpgraderProps extends CreepMemory {
    jobID: JobID;
    sourceID: ObjectID;
    destID: ObjectID;
    isUpgrading: boolean;
}

declare class CreepJob {
    id: JobID;
    type: CreepJobType;
    roomName: string;
}

declare class HarvesterJob extends CreepJob {
    sourceID: ObjectID;
    destID: ObjectID;
}

