import {idbDelete, idbTransaction} from "@/storage/indexDb.ts";
import type {BaseEntity} from "@/model/BaseEntity.ts";
import type {StoreOptions} from "@/storage/indexDb.ts";

type BaseOutBoxEntry = {
    id: string;
    entity: string;
    entityId: string;
    createdAt: number;
    retries: number;
};
type CreateOutBoxEntry<T> = BaseOutBoxEntry & { op: 'CREATE'; payload: T; };
type UpdateOutBoxEntry<T> = BaseOutBoxEntry & { op: 'UPDATE'; payload: Partial<T>; }
type DeleteOutBoxEntry = BaseOutBoxEntry & { op: 'DELETE'; payload: undefined; };
export type OutboxEntry<T> = CreateOutBoxEntry<T> | UpdateOutBoxEntry<T> | DeleteOutBoxEntry;

export const OutboxStoreOptions: StoreOptions = {
    name: 'outbox',
    keyPath: 'id',
}

export class OutboxQueue<T extends BaseEntity> {
    constructor(private db: IDBDatabase) {
    }

    async enqueue(entry: Omit<OutboxEntry<T>, 'id' | 'createdAt' | 'retries'>) {
        const newEntry = {
            ...entry,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            retries: 0,
        } as OutboxEntry<T>;
        await idbTransaction(this.db, 'outbox', 'readwrite', store => store.add(newEntry));
    }

    async getPending(): Promise<OutboxEntry<T>[]> {
        return await idbTransaction(
            this.db,
            'outbox',
            'readonly',
            store => store.getAll()
        ) as Promise<OutboxEntry<T>[]>;
    }

    async remove(id: string) {
        await idbDelete(this.db, 'outbox', id)
    }
}
