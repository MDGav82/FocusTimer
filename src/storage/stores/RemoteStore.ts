import { Cycle } from "@/model/Cycle";
import { Period } from "@/model/Period";
import { PeriodType } from "@/model/PeriodType";
import { Task, Status } from "@/model/Task";
import type { IStore } from "@/storage/IStore.ts";

export class RemoteStore implements IStore {
    private baseUrl: string = (process.env.DATABASE_URL ?? "http://localhost:8080").replace(/\/$/, "");
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

        if (response.status === 204) {
            return {} as T;
        }

        return response.json() as Promise<T>;
    }


    private mapStringToPeriodType(typeName: string): PeriodType {
        const lowerName = typeName.toLowerCase();
        if (lowerName === "work") {
            return PeriodType.WORK;
        }
        return PeriodType.BREAK;
    }

    //TASK
    async createTask(task: Task): Promise<number> {
        const body = {
            title: task.title,
            description: task.description,
            estimated_time: task.estimatedTime
        };
        
        const createdTask = await this.request<Task>(`/api/users/${this.defaultUserId}/tasks`, {
            method: "POST",
            body: JSON.stringify(body),
        });
        
        return createdTask.id;
    }

    async getAllTasks(user_id: number): Promise<Task[]> {
        return this.request<Task[]>(`/api/users/${user_id}/tasks`, {
            method: "GET",
        });
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
                start_date: task.startDate ? task.startDate.toISOString() : new Date().toISOString(),
                status_id: Status.PROGRESS
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
                end_date: task.endDate ? task.endDate.toISOString() : new Date().toISOString(),
                status_id: Status.FINISHED 
            }),
        });
    }

    async deleteTask(task: Task): Promise<void> {
        await this.request<void>(`/api/tasks/${task.id}`, {
            method: "DELETE",
        });
    }

    //CYCLE
    async createCycle(cycle: Cycle): Promise<number> {
        const periodsPayload = cycle.periods?.map(p => ({
            type_periode_id: p.typePeriode.valueOf(),
            time: p.time,
            index: p.index
        })) || [];

        const createdCycle = await this.request<Cycle>(`/api/users/${this.defaultUserId}/cycles`, {
            method: "POST",
            body: JSON.stringify({
                name: cycle.name,
                periods: periodsPayload
            }),
        });

        return createdCycle.id;
    }

    async getAllCycles(user_id: number): Promise<Cycle[]> {
        return this.request<Cycle[]>(`/api/users/${user_id}/cycles`, {
            method: "GET",
        });
    }

    async getCycle(cycle_id: number): Promise<Cycle> {
        return this.request<Cycle>(`/api/cycles/${cycle_id}`, {
            method: "GET",
        });

        
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

    //PERIOD
    async createPeriod(period: Period): Promise<number> {
        const cycleId = "cycleId" in period ? (period as Record<string, number>).cycleId : 1; 

        const createdPeriod = await this.request<Period>(`/api/cycles/${cycleId}/periods`, {
            method: "POST",
            body: JSON.stringify({
                type_periode_id:  period.typePeriode.valueOf(),
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

    mock(): void {
        console.log(`[RemoteStore] Connecté via des modèles directs à l'API : ${this.baseUrl}`);
    }
}