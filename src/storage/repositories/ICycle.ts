import type {Cycle} from "@/model/Cycle.ts";

export interface ICycle {
    /**
     * Create a new cycle
     * @param cycle the cycle to create
     */
    createCycle(cycle: Cycle): Promise<number>

    /**
     * Get all cycles for a given user
     * @param user_id the user id
     * @returns a list of cycles, periods are not included
     */
    getAllCycles(user_id: number): Promise<Cycle[]>

    /**
     * Get a cycle by its id
     * @param cycle_id the cycle id
     * @returns the cycle, periods are included
     */
    getCycle(cycle_id: number): Promise<Cycle>

    /**
     * Update the cycle's name
     * @param cycle the cycle to update
     */
    updateCycleName(cycle: Cycle): Promise<void>

    /**
     * Delete a cycle
     * @param cycle the cycle to delete
     */
    deleteCycle(cycle: Cycle): Promise<void>
}
