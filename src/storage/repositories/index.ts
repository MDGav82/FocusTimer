import {getIndexedDB} from "@/storage/indexDb.ts";
import {HybridUserRepository} from "@/storage/repositories/user/HybridUserRepository.ts";
import {HybridTaskRepository} from "@/storage/repositories/task/HybridTaskRepository.ts";
import {HybridCycleRepository} from "@/storage/repositories/cycle/HybridCycleRepository.ts";
import {HybridPeriodRepository} from "@/storage/repositories/period/HybridPeriodRepository.ts";

const db = await getIndexedDB();
export const UserRepository = new HybridUserRepository(db);
export const TaskRepository = new HybridTaskRepository(db);
export const CycleRepository = new HybridCycleRepository(db);
export const PeriodRepository = new HybridPeriodRepository(db);