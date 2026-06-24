import type {IUserRepository} from "@/storage/repositories/user/IUserRepository.ts";
import {GenericHybridRepository} from "@/storage/repositories/GenericHybridRepository.ts";
import type {User, UserMeta} from "@/model/User.ts";
import {defaultParams, type Parameters} from "@/model/Parameters.ts";
import {ApiUserRepository} from "@/storage/repositories/user/ApiUserRepository.ts";
import {IdbUserRepository} from "@/storage/repositories/user/IdbUserRepository.ts";
import {OutboxQueue} from "@/storage/sync/OutboxQueue.ts";
import * as console from "node:console";
import {CycleRepository, PeriodRepository} from "@/storage/repositories";
import {defaultCycle} from "@/model/Cycle.ts";
import {defaultPeriod, PeriodType} from "@/model/Period.ts";

export class HybridUserRepositor extends GenericHybridRepository<User> implements IUserRepository {
    protected declare api: ApiUserRepository;
    protected declare local: IdbUserRepository;

    constructor(db: IDBDatabase) {
        const api = new ApiUserRepository();
        const local = new IdbUserRepository(db, 'user');
        const outbox = new OutboxQueue<User>(db);
        super(api, local, outbox);
    }

    async updateParameters(id: string, parameters: Partial<Parameters>): Promise<User> {
        const user = await this.local.updateParameters(id, parameters);
        user._syncStatus = 'pending';

        if (await this.connectivity.canUseApi()) {
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
            entity: 'parameters',
            entityId: id,
            payload: user,
        }).then(() => user)
    }

    getLastSessionMeta(): Promise<UserMeta | undefined> {
        return this.local.getLastSessionMeta();
    }

    async createLocalUser(): Promise<User> {
        const now = Date.now();
        const user: User = {
            id: this.generateId(),
            email: undefined,
            parameters: defaultParams,
            updatedAt: now,
            _syncStatus: 'pending',
        };
        const cycle = await CycleRepository.createCycleForUser(user.id, defaultCycle);
        await Promise.all([
            ...defaultPeriod.map(period => PeriodRepository.createPeriodForCycle(cycle.id, period)),
            this.updateSessionMeta({lastUserId: user.id, selectedCycleId: cycle.id})
        ]);
        return this.local.createLocalUser(user);
    }

    updateSessionMeta(data: Partial<UserMeta>): Promise<UserMeta> {
        return this.local.updateSessionMeta(data);
    }
}