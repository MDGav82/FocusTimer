import type {IStore} from "@/storage/IStore.ts";

export class RemoteStore implements IStore {
    constructor() {}

    mock(): void {
        console.log("RemoteStore mocking not implemented yet")
    }
}
