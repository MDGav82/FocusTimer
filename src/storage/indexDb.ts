import type {BaseEntity} from "@/model/BaseEntity.ts";
import {TaskStoreOptions} from "@/model/Task.ts";
import {CycleStoreOptions} from "@/model/Cycle.ts";
import {HistoryStoreOptions} from "@/model/History.ts";
import {PeriodStoreOptions} from "@/model/Period.ts";
import {UserStoreOptions} from "@/model/User.ts";
import {OutboxStoreOptions} from "@/storage/sync/OutboxQueue.ts";

const DB_NAME = "focusTimer";
const DB_VERSION = 1;

export type StoreOptions = {
    name: string,
    keyPath: string,
    indexes?: {
        name: string,
        keyPath: string,
        options?: IDBIndexParameters,
    }[]
}

const stores: StoreOptions[] = [
    TaskStoreOptions,
    CycleStoreOptions,
    HistoryStoreOptions,
    PeriodStoreOptions,
    UserStoreOptions,
    OutboxStoreOptions,
]

export function getIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (_event) => {
            const db = request.result;
            for (const store of stores) {
                if (!db.objectStoreNames.contains(store.name)) {
                    const objectStore = db.createObjectStore(store.name, {keyPath: store.keyPath});
                    for (const idxOpt of store.indexes ?? []) {
                        objectStore.createIndex(idxOpt.name, idxOpt.keyPath, idxOpt.options);
                    }
                }
            }
        };

        request.onsuccess = (_event) => resolve(request.result);
        request.onerror = (_event) => reject(request.error);
    });
}


function request<T>(req: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function runTransaction<T>(
    db: IDBDatabase,
    storeNames: string,
    mode: IDBTransactionMode,
    executor: (store: IDBObjectStore, tx: IDBTransaction) => Promise<T>
): Promise<T> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeNames, mode);
        const store = tx.objectStore(storeNames);

        let result: T;
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error ?? new Error('transaction aborted'));

        Promise.resolve(executor(store, tx))
            .then(r => { result = r; })
            .catch(reject);
    });
}

export function idbTransaction(
    db: IDBDatabase,
    storeName: string,
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => IDBRequest
) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);

        const request = callback(store);

        request.onsuccess = (_event) => resolve(request.result);
        request.onerror   = (_event) => reject(request.error);

        transaction.onerror = (_event) => reject(transaction.error);
        transaction.onabort = (_event) => reject(transaction.error);
    });
}

export function idbAdd<T extends BaseEntity>(
    db: IDBDatabase,
    storeName: string,
    item: T,
    key?: IDBValidKey
) {
    return idbTransaction(
        db,
        storeName,
        'readwrite',
        s =>  s.add(item, key)
    ) as Promise<IDBValidKey>
}

export function idbAddGet<T extends BaseEntity>(
    db: IDBDatabase,
    storeName: string,
    item: T,
    key?: IDBValidKey
): Promise<T> {
    return runTransaction<T>(db, storeName, 'readwrite', async (store) => {
        const addedKey = store.keyPath === null
            ? await request<IDBValidKey>(store.add(item, key))
            : await request<IDBValidKey>(store.add(item));
        return request<T>(store.get(addedKey));
    })
}

// export function idbAddAll<T extends BaseEntity>(
//     db: IDBDatabase,
//     storeName: string,
//     items: T[]
// ): Promise<IDBValidKey[]> {
//     const tx = db.transaction(storeName);
//     const store = tx.objectStore(storeName)
//     return Promise.all(items.map(item => request<IDBValidKey>(store.add(item))));
// }

export function idbGet<T extends BaseEntity>(
    db: IDBDatabase,
    storeName: string,
    id: IDBValidKey
): Promise<T | undefined> {
    return idbTransaction(
        db,
        storeName,
        'readonly',
        s => s.get(id)
    ) as Promise<T | undefined>
}

export function idbUpdate<T extends BaseEntity>(
    db: IDBDatabase,
    storeName: string,
    id: IDBValidKey,
    mutate: (item: T) => T | void
): Promise<T> {
    return runTransaction<T>(db, storeName, 'readwrite', async store => {
        const existing = await request<T>(store.get(id))
        if (!existing === undefined) throw new Error(`No record for key ${id}`);
        const updated = (mutate(existing)) ?? existing;
        await request<IDBValidKey>(store.put(updated));
        return updated;
    })
}

export function idbDelete(
    db: IDBDatabase,
    storeName: string,
    id: IDBValidKey
) {
    return idbTransaction(
        db,
        storeName,
        'readwrite',
        s => s.delete(id)
    ) as Promise<void>
}