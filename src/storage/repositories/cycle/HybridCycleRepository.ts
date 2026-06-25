import {GenericHybridRepository} from "@/storage/repositories/GenericHybridRepository.ts";
import type {Cycle} from "@/model/Cycle.ts";
import {ApiCycleRepository} from "@/storage/repositories/cycle/ApiCycleRepository.ts";
import {OutboxQueue} from "@/storage/sync/OutboxQueue.ts";
import {IdbCycleRepository} from "@/storage/repositories/cycle/IdbCycleRepository.ts";
import type {PureEntity} from "@/model/BaseEntity.ts";
import type {ICycleRepository} from "@/storage/repositories/cycle/ICycleRepository.ts";

export class HybridCycleRepository extends GenericHybridRepository<Cycle> implements ICycleRepository {
    protected declare api: ApiCycleRepository;
    protected declare local: IdbCycleRepository;

    constructor(db: IDBDatabase) {
        const api = new ApiCycleRepository();
        const local = new IdbCycleRepository(db);
        const outbox = new OutboxQueue<Cycle>(db);
        super(api, local, outbox);
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
                const api_cycle = await this.api.createCycleForUser(userId, { ...cycle, _syncStatus: 'synced'});
                await this.local.update(cycle.id, { _syncStatus: 'synced' });
                cycle._syncStatus = 'synced';
                return api_cycle;
            } catch {
                // Fallthrough to local storage
                console.error("Failed to fetch from API");
            }
        }

        await this.outbox.enqueue({
            op: 'CREATE',
            entityType: 'cycle',
            entityId: cycle.id,
            payload: cycle,
        })
        return cycle;
    }

    /**
     * Re-owns this device's local cycles from `oldUserId` to `newUserId` and marks
     * them pending so the outbox re-syncs them under the new account. Their periods
     * are owned transitively through the cycle id (unchanged), so they don't need
     * reassigning — they sync once the cycle exists under the new owner. No-op when
     * the ids match (registration reuses the anonymous id).
     */
    async reassignLocalOwner(oldUserId: string, newUserId: string): Promise<void> {
        if (!oldUserId || oldUserId === newUserId) return;
        const cycles = await this.local.getCyclesForUser(oldUserId);
        await Promise.all(
            cycles.map(c => this.local.update(c.id, { user_id: newUserId, _syncStatus: 'pending' } as Partial<Cycle>))
        );
    }

    async getCyclesForUser(userId: string): Promise<Cycle[]> {
        if (await this.connectivity.canUseApi()) {
            try {
                const apiCycles = await this.api.getCyclesForUser(userId);
                const localCycles = await this.local.getCyclesForUser(userId);
                const merged = new Map(apiCycles.map(c => [c.id, c]));
                for (const cycle of localCycles) {
                    if (cycle._syncStatus === 'pending') {
                        merged.set(cycle.id, cycle);
                    }
                }
                return [...merged.values()];
            } catch {
                // Fallthrough to local storage
                console.error("Failed to fetch from API");
            }
        }
        return this.local.getCyclesForUser(userId);
    }
}