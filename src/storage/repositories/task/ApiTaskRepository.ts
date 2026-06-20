import type {Task} from "@/model/Task.ts";
import type {ITaskRepository} from "@/storage/repositories/task/ITaskRepository.ts";


export class ApiTaskRepository implements ITaskRepository {
    /**
     * Get a task by its id
     * @param id The id of the task to retrieve
     */
    async getById(id: string): Promise<Task | undefined> {
        return fetch(`/api/task/${id}`, {
            method: 'GET',
        }).then(res => res.json());
    }

    /**
     * Update a task by its id
     * @param id The id of the task to update
     * @param entity The updated task data
     */
    async update(id: string, entity: Partial<Task>): Promise<Task> {
        return fetch(`/api/task/${id}`, {
            method: 'PUT',
            body: JSON.stringify(entity),
        }).then(res => res.json());
    }

    /**
     * Delete a task by its id
     * @param id The id of the task to delete
     */
    async delete(id: string): Promise<void> {
        return fetch(`/api/task/${id}`, {
            method: 'DELETE',
        }).then(res => res.json());
    }

    async createTaskForUser(userId: string, task: Task): Promise<Task> {
        return fetch(`/api/user/${userId}/tasks`, {
            method: 'POST',
            body: JSON.stringify(task),
        }).then(res => res.json());
    }

    async getTasksForUser(userId: string): Promise<Task[]> {
        return fetch(`/api/user/${userId}/tasks`, {
            method: 'GET',
        }).then(res => res.json());
    }
}