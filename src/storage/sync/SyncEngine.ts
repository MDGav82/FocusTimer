import type { OutboxQueue, OutboxEntry } from "./OutboxQueue.ts";
import type { ConflictResolver } from "./ConflictResolver.ts";
import type {IRepository} from "@/storage/repositories/IRepository.ts";
import type {BaseEntity} from "@/model/BaseEntity.ts";

export class SyncEngine<T extends BaseEntity> {
  constructor(
      private outbox: OutboxQueue<T>,
      private api: IRepository<T>,
      private local: IRepository<T>,
      private conflictResolver: ConflictResolver,
  ) {}

  async processQueue() {
    const entries = await this.outbox.getPending();

    for (const entry of entries) {
      try {
        // TODO
        // await this.processEntry(entry);
        // await this.outbox.remove(entry.id);
      } catch (e) {
        // if (isConflict(e)) {
        //   await this.handleConflict(entry);
        // } else {
        //   await this.incrementRetry(entry); // Back off, try later
        // }
        // TODO
      }
    }
  }

  private async processEntry(entry: OutboxEntry<T>) {
    switch (entry.op) {
      // TODO
      // case 'CREATE': return this.api.create(entry.payload);
      // case 'UPDATE': return this.api.update(entry.entityId, entry.payload);
      // case 'DELETE': return this.api.delete(entry.entityId);
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
}