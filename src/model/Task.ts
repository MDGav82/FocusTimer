import type {IndexDefinition, StorableInstance} from "@/storage/IObject.ts";
import {register} from "@/storage/IdbStore.ts";

enum Status {
    PENDING = 0,
    PROGRESS = 1,
    FINISHED = 2,
}

@register
export class Task implements StorableInstance {
    static readonly storeName: string = 'task';
    static readonly keyPath: string = 'id';
    static readonly indexes?: IndexDefinition[] = [
        {name: "by_id", keyPath: "id", options: {unique: true}}
    ];

    constructor(
        public id: number,
        public title: string,
        public description: string,
        public testimatedTime: number,
        public progress: number,
        public creationDate: Date,
        public startDate: Date,
        public timeSpent: number,
        public endDate: Date,
        public status: Status
    ) {}
}