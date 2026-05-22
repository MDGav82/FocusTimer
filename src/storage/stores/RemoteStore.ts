import type { Cycle } from "@/model/Cycle";
import type { Period } from "@/model/Period";
import type { Task } from "@/model/Task";
import type { IStore } from "@/storage/IStore.ts";

export class RemoteStore implements IStore {
    //allow for url from env var
    private baseUrl: string = (process.env.DATABASE_URL ?? "http://localhost:8080").replace(/\/$/, "");
    
    // temp id for routes /api/users/:id/
    // TODO: make it works with auth bs 👍
    private defaultUserId: number = 1;

    constructor() {}

    private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options?.headers || {}),
            },
        });

        if (!response.ok) {
            throw new Error(`[RemoteStore Error] ${options?.method || 'GET'} ${endpoint} failed (${response.status})`);
        }

        // if empty(204) fuck sending json 👍
        if (response.status === 204) {
            return {} as T;
        }

        return response.json();
    }

    //task part
    async createTask(task: Task): Promise<number> {
        const body = {
            title: task.title,
            description: task.description,
            estimated_time: task.estimatedTime
        };
        const createdTask = await this.request<any>(`/api/users/${this.defaultUserId}/tasks`, {
            method: "POST",
            body: JSON.stringify(body),
        });
        
        return createdTask.id;
    }

    async getAllTasks(user_id: number): Promise<Task[]> {
        const data = await this.request<any[]>(`/api/users/${user_id}/tasks`, {
            method: "GET",
        });
        
        return data.map(t => ({
            ...t,
            estimatedTime: t.estimated_time,
            timeSpent: t.time_spent,
            creationDate: new Date(t.creation_date),
            startDate: t.start_date ? new Date(t.start_date) : null,
            endDate: t.end_date ? new Date(t.end_date) : null,
            status: t.status_name?.toUpperCase()
        })) as unknown as Task[];
    }

    async updateTaskTitle(task: Task): Promise<void> {
        await this.request<void>(`/api/tasks/${task.id}`, {
            method: "PUT",
            body: JSON.stringify({ title: task.title }),
        });
    }

    async updateTaskDescription(task: Task): Promise<void> {
        await this.request<void>(`/api/tasks/${task.id}`, {
            method: "PUT",
            body: JSON.stringify({ description: task.description }),
        });
    }

    async startTask(task: Task): Promise<void> {
        await this.request<void>(`/api/tasks/${task.id}`, {
            method: "PUT",
            body: JSON.stringify({
                start_date: task.startDate ?? new Date().toISOString(),
                status_id: 2
            }),
        });
    }

    async progressTask(task: Task): Promise<void> {
        await this.request<void>(`/api/tasks/${task.id}`, {
            method: "PUT",
            body: JSON.stringify({
                time_spent: task.timeSpent
            }),
        });
    }

    async endTask(task: Task): Promise<void> {
        await this.request<void>(`/api/tasks/${task.id}`, {
            method: "PUT",
            body: JSON.stringify({
                end_date: task.endDate ?? new Date().toISOString(),
                status_id: 3
            }),
        });
    }

    async deleteTask(task: Task): Promise<void> {
        await this.request<void>(`/api/tasks/${task.id}`, {
            method: "DELETE",
        });
    }

    //cycle part
    async createCycle(cycle: Cycle): Promise<number> {
        const periodsPayload = cycle.periods?.map(p => ({
            type_periode_id: p.typePeriode === ("work" as any) ? 1 : 2,
            time: p.time,
            index: p.index
        })) || [];

        const createdCycle = await this.request<any>(`/api/users/${this.defaultUserId}/cycles`, {
            method: "POST",
            body: JSON.stringify({
                name: cycle.name,
                periods: periodsPayload
            }),
        });

        return createdCycle.id;
    }

    async getAllCycles(user_id: number): Promise<Cycle[]> {
        const data = await this.request<any[]>(`/api/users/${user_id}/cycles`, {
            method: "GET",
        });

        return data.map(c => ({
            id: c.id,
            name: c.name,
            periods: c.periods?.map((p: any) => ({
                id: p.id,
                time: p.time,
                index: p.index,
                typePeriode: p.type_name
            })) || []
        })) as unknown as Cycle[];
    }

    async getCycle(cycle_id: number): Promise<Cycle> {
        const c = await this.request<any>(`/api/cycles/${cycle_id}`, {
            method: "GET",
        });

        return {
            id: c.id,
            name: c.name,
            periods: c.periods?.map((p: any) => ({
                id: p.id,
                time: p.time,
                index: p.index,
                typePeriode: p.type_name
            })) || []
        } as unknown as Cycle;
    }

    async updateCycleName(cycle: Cycle): Promise<void> {
        await this.request<void>(`/api/cycles/${cycle.id}`, {
            method: "PUT",
            body: JSON.stringify({ name: cycle.name }),
        });
    }

    async deleteCycle(cycle: Cycle): Promise<void> {
        await this.request<void>(`/api/cycles/${cycle.id}`, {
            method: "DELETE",
        });
    }

    //period part
    async createPeriod(period: Period): Promise<number> {
        const cycleId = (period as any).cycleId ?? 1; 

        const createdPeriod = await this.request<any>(`/api/cycles/${cycleId}/periods`, {
            method: "POST",
            body: JSON.stringify({
                type_periode_id: period.typePeriode === ("work" as any) ? 1 : 2,
                time: period.time,
                index: period.index
            }),
        });

        return createdPeriod.id;
    }

    async updatePeriodTime(period: Period): Promise<void> {
        await this.request<void>(`/api/periods/${period.id}`, {
            method: "PUT",
            body: JSON.stringify({ time: period.time }),
        });
    }

    async updatePeriodIndex(period: Period): Promise<void> {
        await this.request<void>(`/api/periods/${period.id}`, {
            method: "PUT",
            body: JSON.stringify({ index: period.index }),
        });
    }

    async deletePeriod(period: Period): Promise<void> {
        await this.request<void>(`/api/periods/${period.id}`, {
            method: "DELETE",
        });
    }


    //mock for debugging
    mock(): void {
        console.log(`[RemoteStore] Pointé sur l'API Elysia : ${this.baseUrl}`);
    }
}