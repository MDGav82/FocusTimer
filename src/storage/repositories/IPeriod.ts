import { Period } from "@/model/Period.ts";
import { PeriodType } from "@/model/PeriodType.ts";
import type {Cycle} from "@/model/Cycle.ts";

export interface IPeriod {
    /**
     * Create a new period
     * @param period the period to create
     * @param cyle the cycle the period belongs to
     */
    createPeriod(period: Period, cyle: Cycle): Promise<number>

    /**
     * Update the period's time
     * @param period the period to update
     */
    updatePeriodTime(period: Period): Promise<void>

    /**
     * Update the period's index
     * @param period the period to update
     */
    updatePeriodIndex(period: Period): Promise<void>

    /**
     * Delete a period
     * @param period the period to delete
     */
    deletePeriod(period: Period): Promise<void>
}
