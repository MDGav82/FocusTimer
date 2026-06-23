import type {BaseEntity, PureEntity} from "@/model/BaseEntity.ts";
import type {StoreOptions} from "@/storage/indexDb.ts";

export enum PeriodType {
    WORK = 0,
    REST = 1,
}

export const defaultPeriod: PureEntity<Period>[] = [
    {
        time: 25 * 60,
        typePeriode: PeriodType.WORK,
        index: 1,
        cycle_id: ""
    },
    {
        time: 5 * 60,
        typePeriode: PeriodType.REST,
        index: 2,
        cycle_id: ""
    }
]

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
