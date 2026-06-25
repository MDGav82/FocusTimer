import type {BaseEntity} from "@/model/BaseEntity.ts";
import type {IRepository} from "@/storage/repositories/IRepository.ts";
import type {GenericIndexedDbRepository} from "@/storage/repositories/GenericIndexDbRepository.ts";
import type {OutboxQueue} from "@/storage/sync/OutboxQueue.ts";
import {ConnectivityService} from "@/storage/ConnectivityService.ts";

export class GenericHybridRepository<T extends BaseEntity> implements IRepository<T> {
    protected declare connectivity: ConnectivityService;

    constructor(
        protected api: IRepository<T>,
        protected local: GenericIndexedDbRepository<T>,
        protected outbox: OutboxQueue<T>,
    ) {
        this.connectivity = new ConnectivityService();
    }

    generateId(): string {
        return crypto.randomUUID();
    }

    async getById(id: string): Promise<T | undefined> {
        if (await this.connectivity.canUseApi()) {
            try {
                return await this.api.getById(id);
            } catch {
                // Fallthrough to local storage
                console.error("Failed to fetch from API");
            }
        }
        return this.local.getById(id);
    }

    async update(id: string, data: Partial<T>): Promise<T> {
        const entity = await this.local.update(id, {
            ...data,
            _syncStatus: 'pending',
        } as Partial<T>);

        if (await this.connectivity.canUseApi()) {
            try {
                const synced = await this.api.update(id, data);
                await this.local.update(id, { _syncStatus: 'synced' } as Partial<T>);
                return synced;
            } catch {
                // Fallthrough to local storage
                console.error("Failed to fetch from API");
            }
        }

        await this.outbox.enqueue({
            op: 'UPDATE',
            entityType: this.local.storeName,
            entityId: id,
            payload: data,
        });
        return entity;
    }

    async delete(id: string): Promise<void> {
        await this.local.delete(id);

        if (await this.connectivity.canUseApi()) {
            try {
                await this.api.delete(id);
                return;
            } catch {
                // Fallthrough to local storage
                console.error("Failed to fetch from API");
            }
        }

        await this.outbox.enqueue({
            op: 'DELETE',
            entityType: this.local.storeName,
            entityId: id,
            payload: undefined
        });
    }
}
