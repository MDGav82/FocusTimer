import {GenericHybridRepository} from "@/storage/repositories/GenericHybridRepository.ts";
import type {Cycle} from "@/model/Cycle.ts";
import {ApiCycleRepository} from "@/storage/repositories/cycle/ApiCycleRepository.ts";
import {OutboxQueue} from "@/storage/sync/OutboxQueue.ts";
import {ConnectivityService} from "@/storage/ConnectivityService.ts";
import {IdbCycleRepository} from "@/storage/repositories/cycle/IdbCycleRepository.ts";
import type {PureEntity} from "@/model/BaseEntity.ts";

export class HybridCycleRepository extends GenericHybridRepository<Cycle> implements ApiCycleRepository {
    protected declare api: ApiCycleRepository;
    protected declare local: IdbCycleRepository;

    constructor(db: IDBDatabase) {
        const api = new ApiCycleRepository();
        const local = new IdbCycleRepository(db, 'cycle');
        const outbox = new OutboxQueue<Cycle>(db);
        const connectivity = new ConnectivityService();
        super(api, local, outbox, connectivity);
    }

    async createCycleForUser(userId: string, pureCycle: Omit<PureEntity<Cycle>, 'user_id'>): Promise<Cycle> {
        const cycle = await this.local.createCycleForUser(userId, {
            ...pureCycle,
            user_id: userId,
            id: this.generateId(),
            updatedAt: Date.now(),
            _syncStatus: 'pending',
        } as Cycle);

        if (await this.connectivity.canUseApi()) {
            try {
                const api_cycle = this.api.createCycleForUser(userId, cycle);
                await this.local.update(cycle.id, { _syncStatus: 'synced' });
                return api_cycle;
            } catch {
                // Fallthrough to local storage
                console.error("Failed to fetch from API");
            }
        }

        await this.outbox.enqueue({
            op: 'CREATE',
            entity: 'cycle',
            entityId: cycle.id,
            payload: pureCycle,
        })
        return cycle;
    }

    async getCyclesForUser(userId: string): Promise<Cycle[]> {
        if (await this.connectivity.canUseApi()) {
            try {
                return await this.api.getCyclesForUser(userId);
            } catch {
                // Fallthrough to local storage
                console.error("Failed to fetch from API");
            }
        }
        return this.local.getCyclesForUser(userId);
    }
}