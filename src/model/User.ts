import type { Parameters } from './Parameters.ts';
import type {BaseEntity} from "@/model/BaseEntity.ts";
import type {StoreOptions} from "@/storage/indexDb.ts";

export const UserStoreOptions: StoreOptions = {
    name: 'user',
    keyPath: 'id',
    indexes: [
        {name: "by_id", keyPath: "id", options: {unique: true}}
    ]
}

export interface User extends BaseEntity {
    email?: string;
    parameters: Parameters;
    // tasks: Task[];
    // cycle: Cycle[];
    // history: History[];
}
