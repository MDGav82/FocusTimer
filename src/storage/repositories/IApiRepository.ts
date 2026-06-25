import type {IRepository} from "@/storage/repositories/IRepository.ts";
import type {BaseEntity} from "@/model/BaseEntity.ts";

export interface IApiRepository<T extends BaseEntity> extends IRepository<T> {
    create(entity: T): void;
}