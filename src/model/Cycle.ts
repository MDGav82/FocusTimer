import type {Period} from './Period.ts';
import type {IndexDefinition, StorableInstance} from "@/domain/IObject.ts";
import {register} from "@/domain/IdbStore.ts";

@register
export class Cycle implements StorableInstance {
    static readonly storeName: string = 'cycle';
    static readonly keyPath: string = 'id';
    static readonly indexes?: IndexDefinition[] = [
        {name: "by_id", keyPath: "id", options: {unique: true}}
    ];

    constructor(
        public id: number,
        public name: string,
        public periods: Period[]
    ) {}
}
