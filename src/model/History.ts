import type { PeriodType } from './PeriodType.ts';
import type {IndexDefinition, StorableInstance} from "@/storage/IStorable.ts";

export class History implements StorableInstance {
    static readonly storeName: string = 'history';
    static readonly keyPath: string = 'id';
    static readonly indexes?: IndexDefinition[] = [
        {name: "by_id", keyPath: "id", options: {unique: true}}
    ];

    constructor(
        public id: number,
        public startSate: Date,
        public timespent: number,
        public typePeriode: PeriodType
    ) {}
}
