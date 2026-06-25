import {GenericIndexedDbRepository} from "@/storage/repositories/GenericIndexDbRepository.ts";
import {type Period, PeriodStoreOptions} from "@/model/Period.ts";
import type {IPeriodRepository} from "@/storage/repositories/period/IPeriodRepository.ts";
import {idbAddGet, idbTransaction} from "@/storage/indexDb.ts";

export class IdbPeriodRepository extends GenericIndexedDbRepository<Period> implements IPeriodRepository {
    constructor(db: IDBDatabase) {
        super(db, PeriodStoreOptions.name)
    }

    createPeriodForCycle(_cycleId: string, period: Period): Promise<Period> {
        return idbAddGet(this.db, this.storeName, period);
    }

    getPeriodsForCycle(cycleId: string): Promise<Period[]> {
        return idbTransaction(
            this.db,
            this.storeName,
            'readonly',
            store => store.index('by_cycle_id').getAll(cycleId)
        ) as Promise<Period[]>;
    }
}