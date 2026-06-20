import type {IUserRepository} from "@/storage/repositories/user/IUserRepository.ts";
import {GenericHybridRepository} from "@/storage/repositories/GenericHybridRepository.ts";
import type {User} from "@/model/User.ts";
import type {Parameters} from "@/model/Parameters.ts";
import {ApiUserRepository} from "@/storage/repositories/user/ApiUserRepository.ts";
import {IdbUserRepository} from "@/storage/repositories/user/IdbUserRepository.ts";
import {OutboxQueue} from "@/storage/sync/OutboxQueue.ts";
import {ConnectivityService} from "@/storage/ConnectivityService.ts";

export class HybridUserRepositor extends GenericHybridRepository<User> implements IUserRepository {
    protected declare api: ApiUserRepository;
    protected declare local: IdbUserRepository;

    constructor(db: IDBDatabase) {
        const api = new ApiUserRepository();
        const local = new IdbUserRepository(db, 'user');
        const outbox = new OutboxQueue<User>(db);
        const connectivity = new ConnectivityService();
        super(api, local, outbox, connectivity);
    }

    async updateParameters(id: string, parameters: Partial<Parameters>): Promise<User> {
        const user = await this.local.updateParameters(id, parameters);
        user._syncStatus = 'pending';

        if (this.connectivity.isOnline()) {
            try {
                await this.api.updateParameters(id, parameters);
                await this.local.update(id, { _syncStatus: 'synced' })
                return user;
            } catch {
                // Fallthrough to local storage
                console.error("Failed to fetch from API");
            }
        }

        return this.outbox.enqueue({
            op: 'UPDATE',
            entity: 'user',
            entityId: id,
            payload: parameters,
        }).then(() => user)
    }
}