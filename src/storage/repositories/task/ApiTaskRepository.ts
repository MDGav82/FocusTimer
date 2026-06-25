import type {Task} from "@/model/Task.ts";
import type {ITaskRepository} from "@/storage/repositories/task/ITaskRepository.ts";
import {apiFetch, parseEntity, parseEntityList} from "@/storage/apiFetch.ts";
import {TaskSchema} from "@/model/schemas.ts";
import type {IApiRepository} from "@/storage/repositories/IApiRepository.ts";


export class ApiTaskRepository implements ITaskRepository, IApiRepository<Task> {
    async create(task: Task): Promise<void> {
        await this.createTaskForUser(task.user_id, task);
    }

    /**
     * Get a task by its id
     * @param id The id of the task to retrieve
     */
    async getById(id: string): Promise<Task | undefined> {
        const data = await apiFetch(`/api/task/${id}`, {
            method: 'GET',
        });
        return parseEntity(TaskSchema, data, id);
    }

    /**
     * Update a task by its id
     * @param id The id of the task to update
     * @param entity The updated task data
     */
    async update(id: string, entity: Partial<Task>): Promise<Task> {
        const data = await apiFetch(`/api/task/${id}`, {
            method: 'PUT',
            body: JSON.stringify(entity),
        });
        return parseEntity(TaskSchema, data, id);
    }

    /**
     * Delete a task by its id
     * @param id The id of the task to delete
     */
    async delete(id: string): Promise<void> {
        await apiFetch(`/api/task/${id}`, {
            method: 'DELETE',
        });
    }

    async createTaskForUser(userId: string, task: Task): Promise<Task> {
        const data = await apiFetch(`/api/users/${userId}/tasks`, {
            method: 'POST',
            body: JSON.stringify(task),
        });
        return parseEntity(TaskSchema, data);
    }

    async getTasksForUser(userId: string): Promise<Task[]> {
        const data = await apiFetch(`/api/users/${userId}/tasks`, {
            method: 'GET',
        });
        return parseEntityList(TaskSchema, data);
    }
}
