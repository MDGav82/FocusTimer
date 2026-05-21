import type {IndexDefinition, StorableInstance} from "@/storage/IStorable.ts";

export class Parameters implements StorableInstance {
    static readonly storeName: string = 'parameters';
    static readonly keyPath: string = 'id';
    static readonly indexes?: IndexDefinition[] = [
        {name: "by_id", keyPath: "id", options: {unique: true}}
    ];

    constructor(
        public id: number,
        public autoStartWork: boolean,
        public autoStartRest: boolean,
        public autoRestartCycle: boolean,
        public notificationsOn: boolean
    ) {}
}
