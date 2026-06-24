import {GenericIndexedDbRepository} from "@/storage/repositories/GenericIndexDbRepository.ts";
import type {Cycle} from "@/model/Cycle.ts";
import type {ICycleRepository} from "@/storage/repositories/cycle/ICycleRepository.ts";
import {idbAddGet, idbTransaction} from "@/storage/indexDb.ts";

export class IdbCycleRepository extends GenericIndexedDbRepository<Cycle> implements ICycleRepository {
    createCycleForUser(_userId: string, cycle: Cycle): Promise<Cycle> {
        return idbAddGet(this.db, this.storeName, cycle)
    }

    getCyclesForUser(userId: string): Promise<Cycle[]> {
        return idbTransaction(
            this.db,
            this.storeName,
            'readonly',
            store => store.index('by_user_id').getAll(userId)
        ) as Promise<Cycle[]>;
    }
}