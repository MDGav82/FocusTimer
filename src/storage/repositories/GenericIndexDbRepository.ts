import type {BaseEntity} from "@/model/BaseEntity.ts";
import type {IRepository} from "@/storage/repositories/IRepository.ts";
import {idbDelete, idbGet, idbUpdate} from "@/storage/indexDb.ts";

export class GenericIndexedDbRepository<T extends BaseEntity> implements IRepository<T> {
    constructor(
        protected db: IDBDatabase,
        public storeName: string,
    ) {}

    async getById(id: string): Promise<T | undefined> {
        return idbGet<T>(this.db, this.storeName, id)
    }

    async update(id: string, data: Partial<T>): Promise<T> {
        return idbUpdate(this.db, this.storeName, id, item => ({ ...item, ...data, updatedAt: Date.now() }))
    }

    async delete(id: string): Promise<void> {
        return idbDelete(this.db, this.storeName, id)
    }
}