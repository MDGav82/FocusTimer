import {GenericHybridRepository} from "@/storage/repositories/GenericHybridRepository.ts";
import type {Period} from "@/model/Period.ts";
import type {IPeriodRepository} from "@/storage/repositories/period/IPeriodRepository.ts";
import {ApiPeriodRepository} from "@/storage/repositories/period/ApiPeriodRepository.ts";
import {IdbPeriodRepository} from "@/storage/repositories/period/IdbPeriodRepository.ts";
import {OutboxQueue} from "@/storage/sync/OutboxQueue.ts";
import type {PureEntity} from "@/model/BaseEntity.ts";

export class HybridPeriodRepository extends GenericHybridRepository<Period> implements IPeriodRepository {
    protected declare api: ApiPeriodRepository;
    protected declare local: IdbPeriodRepository;

    constructor(db: IDBDatabase) {
        const api = new ApiPeriodRepository();
        const local = new IdbPeriodRepository(db, 'period');
        const outbox = new OutboxQueue<Period>(db);
        super(api, local, outbox);
    }

    async createPeriodForCycle(cycleId: string, purePeriod: Omit<PureEntity<Period>, 'cycle_id'>): Promise<Period> {
        const period = await this.local.createPeriodForCycle(cycleId, {
            ...purePeriod,
            cycle_id: cycleId,
            id: this.generateId(),
            updatedAt: Date.now(),
            _syncStatus: 'pending',
        })

        if (await this.connectivity.canUseApi()) {
            try {
                const api_period = this.api.createPeriodForCycle(cycleId, { ...period, _syncStatus: 'synced' });
                await this.local.update(period.id, { _syncStatus: 'synced' });
                period._syncStatus = 'synced';
                return api_period;
            } catch {
                // Fallthrough to local storage
                console.error("Failed to fetch from API");
            }
        }

        await this.outbox.enqueue({
            op: 'CREATE',
            entity: 'period',
            entityId: period.id,
            payload: purePeriod,
        })
        return period;
    }

    async getPeriodsForCycle(cycleId: string): Promise<Period[]> {
        if (await this.connectivity.canUseApi()) {
            try {
                return this.api.getPeriodsForCycle(cycleId);
            } catch {
                // Fallthrough to local storage
                console.error("Failed to fetch from API");
            }
        }
        return this.local.getPeriodsForCycle(cycleId);
    }
}