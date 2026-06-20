import type {BaseEntity} from "@/model/BaseEntity.ts";

export interface IRepository<T extends BaseEntity> {
    getById(id: string): Promise<T | undefined>;
    update(id: string, entity: Partial<T>): Promise<T>;
    delete(id: string): Promise<void>;
}