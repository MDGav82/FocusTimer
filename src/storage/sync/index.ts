import {getIndexedDB} from "@/storage/indexDb.ts";
import {MasterSyncEngine} from "@/storage/sync/MasterSyncEngine.ts";

const db = await getIndexedDB()
export const syncEngine = new MasterSyncEngine(db)