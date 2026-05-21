import type {IStore} from "./IStore.ts";
import {IdbStore} from "./stores/IdbStore.ts";
import {RemoteStore} from "./stores/RemoteStore.ts";

class StoreProxy {
    private constructor(private stores: IStore[]) {}

    static async init(): Promise<StoreProxy> {
        return new StoreProxy([
            new RemoteStore(),
            await IdbStore.init(),
        ]);
    }
}