import type {IRepository} from "@/storage/repositories/IRepository.ts";
import type {Period} from "@/model/Period.ts";

export interface IPeriodRepository extends IRepository<Period> {
    createPeriodForCycle(cycleId: string, period: Period): Promise<Period>;
    getPeriodsForCycle(cycleId: string): Promise<Period[]>;
}
