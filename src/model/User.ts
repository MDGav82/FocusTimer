import type { Parameters } from './Parameters.ts';
import type { Task } from './Task.ts';
import type { Cycle } from './Cycle.ts';
import type { History } from './History.ts';
import type { IndexDefinition, StorableInstance } from "@/storage/IStorable.ts";

export class User implements StorableInstance {
    static readonly storeName: string = 'user';
    static readonly keyPath: string = 'id';
    static readonly indexes?: IndexDefinition[] = [
        {name: "by_id", keyPath: "id", options: {unique: true}}
    ];

    constructor(
        public id: number,
        public email: string,
        public parameters: Parameters,
        public task: Task[],
        public cycle: Cycle[],
        public history: History[]
    ) {}
}
