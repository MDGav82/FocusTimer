import {GenericHybridRepository} from "@/storage/repositories/GenericHybridRepository.ts";
import type {Task} from "@/model/Task.ts";
import type {ITaskRepository} from "@/storage/repositories/task/ITaskRepository.ts";
import {OutboxQueue} from "@/storage/sync/OutboxQueue.ts";
import {ApiTaskRepository} from "@/storage/repositories/task/ApiTaskRepository.ts";
import {IdbTaskRepository} from "@/storage/repositories/task/IdbTaskRepository.ts";
import type {PureEntity} from "@/model/BaseEntity.ts";

export class HybridTaskRepository extends GenericHybridRepository<Task> implements ITaskRepository {
    protected declare api: ApiTaskRepository;
    protected declare local: IdbTaskRepository;

    constructor(db: IDBDatabase) {
        const api = new ApiTaskRepository();
        const local = new IdbTaskRepository(db);
        const outbox = new OutboxQueue<Task>(db);
        super(api, local, outbox);
    }

    async createTaskForUser(userId: string, pureTask: Omit<PureEntity<Task>, 'user_id'>): Promise<Task> {
        const task = await this.local.createTaskForUser(userId, {
            ...pureTask,
            user_id: userId,
            id: this.generateId(),
            updatedAt: Date.now(),
            _syncStatus: 'pending',
        } as Task);

        if (await this.connectivity.canUseApi()) {
            try {
                const api_task = await this.api.createTaskForUser(userId, { ...task, _syncStatus: 'synced' });
                await this.local.update(task.id, { _syncStatus: 'synced' });
                task._syncStatus = 'synced'
                return api_task;
            } catch {
                // Fallthrough to local storage
                console.error("Failed to fetch from API");
            }
        }

        await this.outbox.enqueue({
            op: 'CREATE',
            entityType: 'task',
            entityId: task.id,
            payload: task,
        })
        return task;
    }


    /**
     * Re-owns this device's local tasks from `oldUserId` to `newUserId` and marks
     * them pending so the outbox re-syncs them under the new account. Used when an
     * anonymous session logs into an existing account so offline work is adopted
     * instead of staying stuck (403) under the anonymous id. No-op when the ids
     * match — registration reuses the anonymous id, so nothing needs moving.
     */
    async reassignLocalOwner(oldUserId: string, newUserId: string): Promise<void> {
        if (!oldUserId || oldUserId === newUserId) return;
        const tasks = await this.local.getTasksForUser(oldUserId);
        await Promise.all(
            tasks.map(t => this.local.update(t.id, { user_id: newUserId, _syncStatus: 'pending' } as Partial<Task>))
        );
    }

    async getTasksForUser(userId: string): Promise<Task[]> {
        if (await this.connectivity.canUseApi()) {
            try {
                const apiTasks = await this.api.getTasksForUser(userId);
                const localTasks = await this.local.getTasksForUser(userId);
                const merged = new Map(apiTasks.map(t => [t.id, t]));
                for (const task of localTasks) {
                    if (task._syncStatus === 'pending') {
                        merged.set(task.id, task);
                    }
                }
                return [...merged.values()];
            } catch {
                // Fallthrough to local storage
                console.error("Failed to fetch from API");
            }
        }
        return this.local.getTasksForUser(userId);
    }
}