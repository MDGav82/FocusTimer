import {SyncEngine} from "@/storage/sync/SyncEngine.ts";
import type {BaseEntity} from "@/model/BaseEntity.ts";
import type {Task} from "@/model/Task.ts";
import {OutboxQueue} from "@/storage/sync/OutboxQueue.ts";
import {IdbTaskRepository} from "@/storage/repositories/task/IdbTaskRepository.ts";
import {ApiTaskRepository} from "@/storage/repositories/task/ApiTaskRepository.ts";
import {ConflictResolver} from "@/storage/sync/ConflictResolver.ts";
import type {Cycle} from "@/model/Cycle.ts";
import {ApiCycleRepository} from "@/storage/repositories/cycle/ApiCycleRepository.ts";
import {IdbCycleRepository} from "@/storage/repositories/cycle/IdbCycleRepository.ts";
import type {Period} from "@/model/Period.ts";
import {ApiPeriodRepository} from "@/storage/repositories/period/ApiPeriodRepository.ts";
import {IdbPeriodRepository} from "@/storage/repositories/period/IdbPeriodRepository.ts";


export class MasterSyncEngine {
    private declare childEngines: SyncEngine<BaseEntity>[]

    constructor(db: IDBDatabase) {
        const RecentFirstConflitResolver = new ConflictResolver();
        this.childEngines = [
            new SyncEngine<Task>(
                new OutboxQueue(db),
                new ApiTaskRepository(),
                new IdbTaskRepository(db),
                RecentFirstConflitResolver
            ),
            new SyncEngine<Cycle>(
                new OutboxQueue(db),
                new ApiCycleRepository(),
                new IdbCycleRepository(db),
                RecentFirstConflitResolver
            ),
            new SyncEngine<Period>(
                new OutboxQueue(db),
                new ApiPeriodRepository(),
                new IdbPeriodRepository(db),
                RecentFirstConflitResolver,
            )
        ];
    }

    async processQueue() {
        for (const engine of this.childEngines) {
            await engine.processQueue();
        }
    }
}