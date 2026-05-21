import type {StorableConstructor} from "@/storage/IStorable.ts";
import type {IStore} from "@/storage/IStore.ts";
import {Cycle} from "@/model/Cycle.ts";
import {History} from "@/model/History.ts";
import {Parameters} from "@/model/Parameters.ts";
import {Period} from "@/model/Period.ts";
import {Task} from "@/model/Task.ts";
import {User} from "@/model/User.ts";

const DB_NAME = 'focusTimer';
const DB_VERSION = 1;

const registery: StorableConstructor<any>[] = [
    Cycle,
    History,
    Parameters,
    Period,
    Task,
    User
];

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (_event) => {
            const db = request.result;
            for (const ctor of registery) {
                if (!db.objectStoreNames.contains(ctor.storeName)) {
                    const store = db.createObjectStore(ctor.storeName, { keyPath: ctor.keyPath });
                    for (const idx of ctor.indexes ?? []) {
                        store.createIndex(idx.name, idx.keyPath, idx.options)
                    }
                }
            }
        };

        request.onsuccess = (_event) => resolve(request.result);
        request.onerror = (_event) => reject(request.error);
    });
}

function tx(
    db: IDBDatabase,
    options: {
        storeName: string;
        mode?: IDBTransactionMode;
        options?: IDBTransactionOptions;
    },
    callback: (store: IDBObjectStore) => IDBRequest
) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(options.storeName, options.mode, options.options);
        const store = transaction.objectStore(options.storeName);

        const request = callback(store);

        request.onsuccess = (_event) => resolve(request.result);
        request.onerror = (_event) => reject(request.error);

        transaction.onerror = (_event) => reject(transaction.error);
    });
}

export class IdbStore implements IStore {
    private constructor(private db: IDBDatabase) {}

    mock(): void {
        console.log("IndexedDB mocking not implemented yet")
    }

    static async init() {
        const db = await openDB();
        return new IdbStore(db);
    }

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
}