import type {BaseEntity} from "@/model/BaseEntity.ts";
import type {StoreOptions} from "@/storage/indexDb.ts";

export enum PeriodType {
    WORK = 0,
    REST = 1,
}

export const PeriodStoreOptions: StoreOptions = {
    name: 'period',
    keyPath: 'id',
    indexes: [
        { name: "by_id", keyPath: "id", options: { unique: true } },
        { name: "by_cycle_id", keyPath: "cycle_id" }
    ]
}

export interface Period extends BaseEntity {
     time: number;
     index: number;
     typePeriode: PeriodType;

     cycle_id: string;
}
