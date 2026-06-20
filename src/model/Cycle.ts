import type {BaseEntity} from "@/model/BaseEntity.ts";
import type {StoreOptions} from "@/storage/indexDb.ts";

export const CycleStoreOptions: StoreOptions = {
    name: 'cycle',
    keyPath: 'id',
    indexes: [
        { name: "by_id", keyPath: "id", options: { unique: true } },
        { name: "by_user_id", keyPath: "user_id" }
    ]
}

export interface Cycle extends BaseEntity {
    id: string;
    name: string;
    // periods: Period[];

    user_id: string;
}
