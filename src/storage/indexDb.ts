import type {BaseEntity, StorableEntity} from "@/model/BaseEntity.ts";
import {TaskStoreOptions} from "@/model/Task.ts";
import {CycleStoreOptions} from "@/model/Cycle.ts";
import {HistoryStoreOptions} from "@/model/History.ts";
import {PeriodStoreOptions} from "@/model/Period.ts";
import {UserStoreOptions, UserMetaStoreOptions} from "@/model/User.ts";
import {OutboxStoreOptions} from "@/storage/sync/OutboxQueue.ts";

const DB_NAME = "focusTimer";
const DB_VERSION = 6;

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
    UserMetaStoreOptions,
    OutboxStoreOptions,
]

export function getIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = request.result;
            // @ts-ignore
            const tx = (event.target?.transaction) as IDBTransaction;
            for (const store of stores) {
                const objectStore = !db.objectStoreNames.contains(store.name)
                    ? db.createObjectStore(store.name, {keyPath: store.keyPath})
                    : tx.objectStore(store.name)
                for (const idxOpt of store.indexes ?? []) {
                    if (!objectStore.indexNames.contains(idxOpt.name)) {
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

export function idbAdd<T extends StorableEntity>(
    db: IDBDatabase,
    storeName: string,
    item: T,
) {
    return idbTransaction(
        db,
        storeName,
        'readwrite',
        s =>  s.add(item)
    ) as Promise<IDBValidKey>
}

export function idbAddGet<T extends StorableEntity>(
    db: IDBDatabase,
    storeName: string,
    item: T
): Promise<T> {
    return runTransaction<T>(db, storeName, 'readwrite', async (store) => {
        const addedKey = await request<IDBValidKey>(store.add(item))
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

export function idbGet<T extends StorableEntity>(
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

export function idbUpdate<T extends StorableEntity>(
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