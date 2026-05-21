import type {StorableConstructor, StorableInstance} from "@/domain/IObject.ts";
import type {IStore} from "@/domain/IStore.ts";

const DB_NAME = 'focusTimer';
const DB_VERSION = 1;

const registery: StorableConstructor<any>[] = [];

export function register<T extends StorableInstance>(objectType: StorableConstructor<T>) {
    registery.push(objectType);
    return objectType;
}

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
}