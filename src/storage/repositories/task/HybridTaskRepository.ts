import {GenericHybridRepository} from "@/storage/repositories/GenericHybridRepository.ts";
import type {Task} from "@/model/Task.ts";
import type {ITaskRepository} from "@/storage/repositories/task/ITaskRepository.ts";
import {OutboxQueue} from "@/storage/sync/OutboxQueue.ts";
import {ConnectivityService} from "@/storage/ConnectivityService.ts";
import {ApiTaskRepository} from "@/storage/repositories/task/ApiTaskRepository.ts";
import {IdbTaskRepository} from "@/storage/repositories/task/IdbTaskRepository.ts";
import type {PureEntity} from "@/model/BaseEntity.ts";

export class HybridTaskRepository extends GenericHybridRepository<Task> implements ITaskRepository {
    protected declare api: ApiTaskRepository;
    protected declare local: IdbTaskRepository;

    constructor(db: IDBDatabase) {
        const api = new ApiTaskRepository();
        const local = new IdbTaskRepository(db, 'task');
        const outbox = new OutboxQueue<Task>(db);
        const connectivity = new ConnectivityService();
        super(api, local, outbox, connectivity);
    }

    async createTaskForUser(userId: string, pureTask: PureEntity<Task>): Promise<Task> {
        const task = await this.local.createTaskForUser(userId, {
            ...pureTask,
            user_id: userId,
            id: this.generateId(),
            updatedAt: Date.now(),
            _syncStatus: 'pending',
        } as Task);

        if (this.connectivity.isOnline()) {
            try {
                const api_task = this.api.createTaskForUser(userId, task);
                await this.local.update(task.id, { _syncStatus: 'synced' });
                return api_task;
            } catch {
                // Fallthrough to local storage
                console.error("Failed to fetch from API");
            }
        }

        await this.outbox.enqueue({
            op: 'CREATE',
            entity: 'task',
            entityId: task.id,
            payload: pureTask,
        })
        return task;
    }


    async getTasksForUser(userId: string): Promise<Task[]> {
        if (this.connectivity.isOnline()) {
            try {
                return await this.api.getTasksForUser(userId);
            } catch {
                // Fallthrough to local storage
                console.error("Failed to fetch from API");
            }
        }
        return this.local.getTasksForUser(userId);
    }
}