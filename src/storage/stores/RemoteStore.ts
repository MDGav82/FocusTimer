import type { Cycle } from "@/model/Cycle";
import type { Period } from "@/model/Period";
import type { Task } from "@/model/Task";
import type { IStore } from "@/storage/IStore.ts";

export class RemoteStore implements IStore {
    //allow for url from env var
    private baseUrl: string = (process.env.API_URL ?? "http://localhost:8080/api").replace(/\/$/, "");

    constructor() {}

    // Helper used to centralize Fetch calls
    private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options?.headers || {}),
            },
        });

        if (!response.ok) {
            throw new Error(`[RemoteStore Error] ${options?.method || 'GET'} ${endpoint} failed with status ${response.status}`);
        }

        // if empty(204) fuck sending json 👍
        if (response.status === 204) {
            return {} as T;
        }

        return response.json();
    }

    //task part
    async createTask(task: Task): Promise<void> {
        await this.request<void>("/tasks", {
            method: "POST",
            body: JSON.stringify(task),
        });
    }

    async getAllTasks(user_id: number): Promise<Task[]> {
        return this.request<Task[]>(`/tasks?user_id=${user_id}`, {
            method: "GET",
        });
    }

    async updateTaskTitle(task: Task): Promise<void> {
        await this.request<void>(`/tasks/${task.id}/title`, {
            method: "PATCH",
            body: JSON.stringify({ title: task.title }),
        });
    }

    async updateTaskDescription(task: Task): Promise<void> {
        await this.request<void>(`/tasks/${task.id}/description`, {
            method: "PATCH",
            body: JSON.stringify({ description: task.description }),
        });
    }

    async startTask(task: Task): Promise<void> {
        await this.request<void>(`/tasks/${task.id}/start`, {
            method: "POST",
            body: JSON.stringify({ startDate: task.startDate }),
        });
    }

    async progressTask(task: Task): Promise<void> {
        await this.request<void>(`/tasks/${task.id}/progress`, {
            method: "PUT",
            body: JSON.stringify({ timeSpent: task.timeSpent, status: task.status }),
        });
    }

    async endTask(task: Task): Promise<void> {
        await this.request<void>(`/tasks/${task.id}/end`, {
            method: "POST",
            body: JSON.stringify({ endDate: task.endDate, status: task.status }),
        });
    }

    async deleteTask(task: Task): Promise<void> {
        await this.request<void>(`/tasks/${task.id}`, {
            method: "DELETE",
        });
    }


    //cycle part
    async createCycle(cycle: Cycle): Promise<void> {
        await this.request<void>("/cycles", {
            method: "POST",
            body: JSON.stringify(cycle),
        });
    }

    async getAllCycles(user_id: number): Promise<Cycle[]> {
        return this.request<Cycle[]>(`/cycles?user_id=${user_id}`, {
            method: "GET",
        });
    }

    async getCycle(cycle_id: number): Promise<Cycle> {
        return this.request<Cycle>(`/cycles/${cycle_id}`, {
            method: "GET",
        });
    }

    async updateCycleName(cycle: Cycle): Promise<void> {
        await this.request<void>(`/cycles/${cycle.id}/name`, {
            method: "PATCH",
            body: JSON.stringify({ name: cycle.name }),
        });
    }

    async deleteCycle(cycle: Cycle): Promise<void> {
        await this.request<void>(`/cycles/${cycle.id}`, {
            method: "DELETE",
        });
    }

    
    //period part
    async createPeriod(period: Period): Promise<void> {
        await this.request<void>("/periods", {
            method: "POST",
            body: JSON.stringify(period),
        });
    }

    async updatePeriodTime(period: Period): Promise<void> {
        await this.request<void>(`/periods/${period.id}/time`, {
            method: "PATCH",
            body: JSON.stringify({ time: period.time }),
        });
    }

    async updatePeriodIndex(period: Period): Promise<void> {
        await this.request<void>(`/periods/${period.id}/index`, {
            method: "PATCH",
            body: JSON.stringify({ index: period.index }),
        });
    }

    async deletePeriod(period: Period): Promise<void> {
        await this.request<void>(`/periods/${period.id}`, {
            method: "DELETE",
        });
    }

    //mock for debugging
    mock(): void {
        console.log(`[RemoteStore] Mocking active. Target API URL: ${this.baseUrl}`);
    }
}