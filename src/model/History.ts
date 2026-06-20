import type {BaseEntity} from "@/model/BaseEntity.ts";
import type {PeriodType} from "@/model/Period.ts";
import type {StoreOptions} from "@/storage/indexDb.ts";

export const HistoryStoreOptions: StoreOptions = {
    name: 'history',
    keyPath: 'id',
    indexes: [
        { name: "by_id", keyPath: "id", options: { unique: true } },
        { name: "by_user_id", keyPath: "user_id" }
    ]
}

export interface History extends BaseEntity {
     startSate: Date;
     timespent: number;
     typePeriode: PeriodType;

     user_id: string;
}
