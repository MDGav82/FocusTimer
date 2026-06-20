import type {IRepository} from "@/storage/repositories/IRepository.ts";
import type {Cycle} from "@/model/Cycle.ts";

export interface ICycleRepository extends IRepository<Cycle> {
    createCycleForUser(userId: string, cycle: Cycle): Promise<Cycle>;
    getCyclesForUser(userId: string): Promise<Cycle[]>;
}