import type { Cycle } from "@/model/Cycle";
import type { Period } from "@/model/Period";
import type { Task } from "@/model/Task";
import type {IStore} from "@/storage/IStore.ts";

export class RemoteStore implements IStore {
    constructor() {}

    createTask(task: Task): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getAllTasks(user_id: number): Promise<Task[]> {
        throw new Error("Method not implemented.");
    }
    updateTaskTitle(task: Task): Promise<void> {
        throw new Error("Method not implemented.");
    }
    updateTaskDescription(task: Task): Promise<void> {
        throw new Error("Method not implemented.");
    }
    startTask(task: Task): Promise<void> {
        throw new Error("Method not implemented.");
    }
    progressTask(task: Task): Promise<void> {
        throw new Error("Method not implemented.");
    }
    endTask(task: Task): Promise<void> {
        throw new Error("Method not implemented.");
    }
    deleteTask(task: Task): Promise<void> {
        throw new Error("Method not implemented.");
    }
    createCycle(cycle: Cycle): Promise<void> {
        throw new Error("Method not implemented.");
    }
    getAllCycles(user_id: number): Promise<Cycle[]> {
        throw new Error("Method not implemented.");
    }
    getCycle(cycle_id: number): Promise<Cycle> {
        throw new Error("Method not implemented.");
    }
    updateCycleName(cycle: Cycle): Promise<void> {
        throw new Error("Method not implemented.");
    }
    deleteCycle(cycle: Cycle): Promise<void> {
        throw new Error("Method not implemented.");
    }
    createPeriod(period: Period): Promise<void> {
        throw new Error("Method not implemented.");
    }
    updatePeriodTime(period: Period): Promise<void> {
        throw new Error("Method not implemented.");
    }
    updatePeriodIndex(period: Period): Promise<void> {
        throw new Error("Method not implemented.");
    }
    deletePeriod(period: Period): Promise<void> {
        throw new Error("Method not implemented.");
    }

    mock(): void {
        console.log("RemoteStore mocking not implemented yet")
    }
}
