import type {BaseEntity} from "@/model/BaseEntity.ts";
import type {StoreOptions} from "@/storage/indexDb.ts";

export enum TaskStatus {
    PENDING = 0,
    PROGRESS = 1,
    FINISHED = 2,
}

export const TaskStoreOptions: StoreOptions = {
    name: 'task',
    keyPath: 'id',
    indexes: [
        { name: "by_id", keyPath: "id", options: { unique: true } },
        { name: "by_user_id", keyPath: "user_id" }
    ]
}

export interface Task extends BaseEntity {
    title: string;
    description: string;
    estimatedTime: number;
    creationDate: Date;
    startDate?: Date;
    timeSpent: number;
    endDate?: Date;
    status: TaskStatus;

    user_id: string;
}