import type { OutboxQueue, OutboxEntry } from "./OutboxQueue.ts";
import type { ConflictResolver } from "./ConflictResolver.ts";
import type {BaseEntity} from "@/model/BaseEntity.ts";
import type {IApiRepository} from "@/storage/repositories/IApiRepository.ts";
import type {GenericIndexedDbRepository} from "@/storage/repositories/GenericIndexDbRepository.ts";

export class SyncEngine<T extends BaseEntity> {
  constructor(
      private outbox: OutboxQueue<T>,
      private api: IApiRepository<T>,
      private local: GenericIndexedDbRepository<T>,
      private conflictResolver: ConflictResolver,
  ) {}

  async processQueue() {
    const entries = await this.outbox.getPending(this.local.storeName);
    entries.sort((a, b) => a.createdAt - b.createdAt);

    for (const entry of entries) {
      try {
        await this.processEntry(entry);
        if (entry.op !== 'DELETE') {
          await this.local.update(entry.entityId, { _syncStatus: 'synced' } as Partial<T>);
        }
        await this.outbox.remove(entry.id);
      } catch (e) {
        if (this.isConflictError(e)) {
          await this.handleConflict(entry);
        } else {
          console.log("Failed to resolve conflict", e)
          await this.outbox.incrementRetry(entry.id);
        }
      }
    }
  }

  private async processEntry(entry: OutboxEntry<T>) {
    switch (entry.op) {
      case 'CREATE': {
        const localEntity = await this.local.getById(entry.entityId);
        if (!localEntity) throw new Error(`Local entity ${entry.entityId} not found for CREATE`);
        return this.api.create(entry.payload);
      }
      case 'UPDATE':
        return this.api.update(entry.entityId, entry.payload);
      case 'DELETE':
        return this.api.delete(entry.entityId);
    }
  }

  private async handleConflict(entry: OutboxEntry<T>) {
    const serverVersion = await this.api.getById(entry.entityId);
    const localVersion = await this.local.getById(entry.entityId);
    const resolved = this.conflictResolver.resolve(localVersion!, serverVersion!) as T;

    await this.local.update(entry.entityId, { ...resolved, _syncStatus: 'synced' });
    await this.api.update(entry.entityId, resolved);
    await this.outbox.remove(entry.id);
  }

  private isConflictError(e: unknown): boolean {
    if (!(e instanceof Error)) return false;
    return /status\s+(409|412)/.test(e.message);
  }
}