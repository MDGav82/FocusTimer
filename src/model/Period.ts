import type {PeriodType} from "./PeriodType.ts";
import type {IndexDefinition, StorableInstance} from "@/domain/IObject.ts";
import {register} from "@/domain/IdbStore.ts";

@register
export class Period implements StorableInstance {
    static readonly storeName: string = 'period';
    static readonly keyPath: string = 'id';
    static readonly indexes?: IndexDefinition[] = [
        {name: "by_id", keyPath: "id", options: {unique: true}}
    ];

    constructor(
        public id: number,
        public time: number,
        public index: number,
        public typePeriode: PeriodType
    ) {}
}
