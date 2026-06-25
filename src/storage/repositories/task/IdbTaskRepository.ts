import {GenericIndexedDbRepository} from "@/storage/repositories/GenericIndexDbRepository.ts";
import {type Task, TaskStoreOptions} from "@/model/Task.ts";
import type {ITaskRepository} from "@/storage/repositories/task/ITaskRepository.ts";
import {idbAddGet, idbTransaction} from "@/storage/indexDb.ts";

export class IdbTaskRepository extends GenericIndexedDbRepository<Task> implements ITaskRepository {
    constructor(db: IDBDatabase) {
        super(db, TaskStoreOptions.name);
    }

    async createTaskForUser(_userId: string, task: Task): Promise<Task> {
        return idbAddGet(this.db, this.storeName, task)
    }

    getTasksForUser(userId: string): Promise<Task[]> {
        return idbTransaction(
            this.db,
            this.storeName,
            'readonly',
            store => store.index('by_user_id').getAll(userId)
        ) as Promise<Task[]>;
    }
}